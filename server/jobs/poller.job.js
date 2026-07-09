import cron from "node-cron";
import pLimit from "p-limit";
import Endpoint from "../models/Endpoint.js";
import { checkEndpoint } from "../services/proxyService.js";

// How many endpoints to check in parallel per tick. This does NOT fix
// horizontal scaling (running 2+ server instances) — it only fixes the
// sequential-await bottleneck within a single instance. For true multi-instance
// safety without duplicate alerts, move this to BullMQ + Redis with a distributed
// lock/queue. The isChecking claim below is a stopgap that prevents the *same*
// endpoint being polled twice in the same minute even across instances sharing
// one Mongo cluster — it does not eliminate the "wasted work" of every instance
// listing all endpoints every minute.
const CONCURRENCY = Number(process.env.POLLER_CONCURRENCY) || 10;

export const startPoller = () => {
  // Safety net: if a previous process crashed mid-check, isChecking could be
  // stuck `true` forever, permanently skipping that endpoint. Clear on boot.
  Endpoint.updateMany(
    { isChecking: true },
    { $set: { isChecking: false } },
  ).catch((err) =>
    console.error("Failed to clear stale poller locks:", err.message),
  );

  cron.schedule("* * * * *", async () => {
    const limit = pLimit(CONCURRENCY);
    try {
      const now = new Date();
      const endpoints = await Endpoint.find({ status: { $ne: "paused" } });

      const due = endpoints.filter((endpoint) => {
        const lastChecked = endpoint.lastCheckedAt
          ? new Date(endpoint.lastCheckedAt)
          : null;
        const intervalMs = (endpoint.intervalMin || 5) * 60 * 1000;
        return !lastChecked || now - lastChecked >= intervalMs;
      });

      if (due.length === 0) return;

      const results = await Promise.allSettled(
        due.map((endpoint) =>
          limit(async () => {
            // Atomic claim: only proceed if we can flip isChecking false -> true.
            // If another instance's tick already claimed this endpoint (or a
            // previous check is still running past the 1-min tick), skip it.
            const claimed = await Endpoint.findOneAndUpdate(
              { _id: endpoint._id, isChecking: { $ne: true } },
              { $set: { isChecking: true, checkClaimedAt: new Date() } },
            );
            if (!claimed) return;

            try {
              await checkEndpoint(endpoint);
            } catch (err) {
              console.error(`Poller error for ${endpoint.name}:`, err.message);
            } finally {
              await Endpoint.findByIdAndUpdate(endpoint._id, {
                $set: { isChecking: false },
              });
            }
          }),
        ),
      );

      for (const r of results) {
        if (r.status === "rejected")
          console.error("Poller task rejected:", r.reason?.message ?? r.reason);
      }
    } catch (err) {
      console.error("Poller job error:", err.message);
    }
  });

  console.log(
    `Poller started — checking every minute, concurrency=${CONCURRENCY}`,
  );
};

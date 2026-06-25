import cron from "node-cron";
import Endpoint from "../models/Endpoint.js";
import { checkEndpoint } from "../services/proxyService.js";

export const startPoller = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const endpoints = await Endpoint.find({ status: { $ne: "paused" } });
      for (const endpoint of endpoints) {
        const now = new Date();
        const lastChecked = endpoint.lastCheckedAt
          ? new Date(endpoint.lastCheckedAt)
          : null;
        const intervalMs = (endpoint.intervalMin || 5) * 60 * 1000;
        const shouldCheck = !lastChecked || now - lastChecked >= intervalMs;
        if (shouldCheck) {
          checkEndpoint(endpoint).catch((err) =>
            console.error(`Poller error for ${endpoint.name}:`, err.message),
          );
        }
      }
    } catch (err) {
      console.error("Poller job error:", err.message);
    }
  });
  console.log("Poller started — checking every minute");
};

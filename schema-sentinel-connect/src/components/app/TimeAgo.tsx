import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/mock";

// Hydration-safe boolean: false on the server + first client paint, true after.
// Relative-time strings depend on Date.now(), which differs between the SSR
// render and the client render — rendering them directly causes React #418
// (hydration text mismatch). Gate them behind this so both passes agree.
const subscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const hydrated = useHydrated();
  return <span className={className}>{hydrated ? timeAgo(iso) : "·"}</span>;
}

function relSecs(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

export function RelTime({ t, className }: { t: number; className?: string }) {
  const hydrated = useHydrated();
  return <span className={className}>{hydrated ? relSecs(t) : "·"}</span>;
}

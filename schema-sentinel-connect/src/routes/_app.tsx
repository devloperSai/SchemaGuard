import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/mock";
import { store } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    // SSR-safe: only enforce on the client. Mock auth lives in localStorage.
    if (typeof window === "undefined") return;
    if (!auth.getToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  // Pull real endpoints/collections from the backend once the auth gate has
  // passed. Falls back to local demo data automatically if the API is down
  // (see store.init()).
  useEffect(() => {
    store.init();
  }, []);

  return <Outlet />;
}

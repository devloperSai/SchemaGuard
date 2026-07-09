import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { auth } from "@/lib/auth";
import { store } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // SSR-safe: only enforce on the client. The JWT lives in localStorage.
    if (typeof window === "undefined") return;
    const token = auth.getToken();
    if (!token) {
      throw redirect({ to: "/login" });
    }
    // Validate the token is still good (not expired / user still exists)
    // rather than trusting its mere presence.
    const user = await auth.refresh();
    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  // Pull real endpoints/collections from the backend once the auth gate has
  // passed.
  useEffect(() => {
    store.init();
  }, []);

  return <Outlet />;
}

import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { GapSection } from "@/components/landing/GapSection";
import { Flow } from "@/components/landing/Flow";
import { Pillars } from "@/components/landing/Pillars";
import { AlertCard } from "@/components/landing/AlertCard";
import { Compare } from "@/components/landing/Compare";
import { Users } from "@/components/landing/Users";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchemaGuard — The circuit breaker for your API integrity" },
      {
        name: "description",
        content:
          "SchemaGuard detects API schema drift in real time, freezes your dashboard with last-known-good data, and alerts your team before users ever notice.",
      },
      { property: "og:title", content: "SchemaGuard — Detect API schema drift before it breaks your UI" },
      {
        property: "og:description",
        content:
          "A lightweight proxy that watches API response shapes, classifies drift by severity, and auto-protects your frontend.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <GapSection />
        <Flow />
        <Pillars />
        <AlertCard />
        <Compare />
        <Users />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

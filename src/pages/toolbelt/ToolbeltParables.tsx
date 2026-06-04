/**
 * ToolbeltParables.tsx
 *
 * Public page that hosts the standalone Modern Parable generator.
 * Mirrors the ToolbeltLanding shell (Header + main + Footer). The
 * ParableGenerator component handles anonymous (3/day) vs authenticated
 * (7/month) usage internally, so this page just provides the public chrome.
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ParableGenerator from "@/components/ParableGenerator";

export default function ToolbeltParables() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background border-b border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
              Modern Parable Generator
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Generate a contemporary parable in the teaching style of Jesus --
              grounded in Scripture and shaped for your audience.
            </p>
          </div>
        </section>

        {/* Generator */}
        <section className="py-6 sm:py-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <ParableGenerator context="standalone" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

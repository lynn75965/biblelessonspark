import { useRef } from "react";
import { Hero } from "@/components/curriculum-eval/Hero";
import { WhyConsider } from "@/components/curriculum-eval/WhyConsider";
import { ComparisonTable } from "@/components/curriculum-eval/ComparisonTable";
import { Wizard } from "@/components/curriculum-eval/Wizard";
import { ClosingSection } from "@/components/curriculum-eval/ClosingSection";

export default function CurriculumEvaluationPage() {
  const wizardRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLElement>(null);
  const closingRef = useRef<HTMLElement>(null);

  const scrollToWizard = () => {
    wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToClosing = () => {
    closingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-background">
      <Hero onStart={scrollToWizard} onSeeComparison={scrollToComparison} />
      <WhyConsider />
      <ComparisonTable ref={comparisonRef} />
      <section className="border-b border-border bg-secondary/20">
        <div ref={wizardRef} className="mx-auto max-w-5xl px-6 py-16 scroll-mt-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              A Few Honest Questions About Your Church
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Five to seven short steps. Each one is a normal leadership question -- about Scripture, teachers, members, and setting. Your responses stay on this page; nothing is sent or saved. There is no wrong answer.
            </p>
          </div>
          <Wizard onScrollToClosing={scrollToClosing} />
        </div>
      </section>
      <ClosingSection ref={closingRef} />
    </main>
  );
}

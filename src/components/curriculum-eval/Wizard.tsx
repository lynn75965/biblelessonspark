import { useState, useMemo, useRef, useEffect } from "react";
import { STEPS } from "@/lib/curriculum-eval/schema";
import { scoreAnswers } from "@/lib/curriculum-eval/scoring";
import type { Answer, Answers, ScoreReport } from "@/lib/curriculum-eval/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepCard } from "./StepCard";
import { Results } from "./Results";

type Phase =
  | { kind: "step"; index: number }
  | { kind: "interstitial"; report: ScoreReport }
  | { kind: "result"; report: ScoreReport };

interface Props {
  onScrollToClosing: () => void;
}

export function Wizard({ onScrollToClosing }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>({ kind: "step", index: 0 });
  const [unlockedAfterLow, setUnlockedAfterLow] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step6Answered = useMemo(
    () => STEPS.find((s) => s.id === "step6")?.questions.some((q) => answers[q.id]) ?? false,
    [answers],
  );
  const step7Answered = useMemo(
    () => STEPS.find((s) => s.id === "step7")?.questions.some((q) => answers[q.id]) ?? false,
    [answers],
  );
  const activeSteps = useMemo(() => {
    if (phase.kind === "result") {
      return STEPS.filter((s) => {
        if (s.id === "step6") return step6Answered;
        if (s.id === "step7") return step7Answered;
        return true;
      });
    }
    return STEPS;
  }, [phase, step6Answered, step7Answered]);

  const totalSteps = useMemo(() => {
    if (phase.kind === "result") return activeSteps.length;
    return 7;
  }, [phase, activeSteps]);

  const setAnswer = (qid: string, a: Answer) => {
    setAnswers((prev) => ({ ...prev, [qid]: a }));
  };

  const isStepComplete = (stepIdx: number) => {
    const step = STEPS[stepIdx];
    return step.questions.every((q) => {
      const a = answers[q.id];
      if (!a) return false;
      if (Array.isArray(a.value)) return a.value.length > 0;
      return typeof a.value === "string" && a.value.length > 0;
    });
  };

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase]);

  if (phase.kind === "result") {
    return (
      <div ref={cardRef} className="scroll-mt-24">
        <Results
          report={phase.report}
          answers={answers}
          includeStep6={activeSteps.some((s) => s.id === "step6")}
          includeStep7={activeSteps.some((s) => s.id === "step7")}
          onScrollToClosing={onScrollToClosing}
          onRestart={() => {
            setAnswers({});
            setPhase({ kind: "step", index: 0 });
            setUnlockedAfterLow(false);
          }}
        />
      </div>
    );
  }

  if (phase.kind === "interstitial") {
    const r = phase.report;
    const tier = r.transitionReadiness;
    return (
      <div ref={cardRef} className="scroll-mt-24 mx-auto max-w-3xl">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
            {tier === "low"
              ? "Your church may not be ready for a church-wide curriculum transition yet."
              : tier === "moderate"
                ? "Your church may be open to a small pilot."
                : "Your responses suggest a structured pilot may be worth considering."}
          </h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            {tier === "low"
              ? "Your responses suggest there is interest in locally prepared curriculum, but leadership, teachers, or members may not yet be ready to move away from familiar published curriculum. A full church-wide pilot could create confusion or resistance if introduced too quickly. The wiser next step may be personal lesson preparation rather than church-wide implementation."
              : tier === "moderate"
                ? "Your church may be open to a small pilot, but a full transition would be premature. A few more questions about print and digital readiness, and a brief look at what a pilot could involve, will sharpen the recommendation."
                : "The next questions will help identify the best print, digital, and pilot approach so the recommendation reflects your specific setting."}
          </p>
          <div className="flex flex-wrap gap-3">
            {tier === "low" ? (
              <Button
                onClick={() => {
                  setUnlockedAfterLow(true);
                  setPhase({ kind: "step", index: 5 });
                }}
              >
                Continue to Print and Pilot Planning
              </Button>
            ) : (
              <Button onClick={() => setPhase({ kind: "step", index: 5 })}>
                Continue to Print and Pilot Planning
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const idx = phase.index;
  const step = STEPS[idx];
  const stepNumber = idx + 1;
  const complete = isStepComplete(idx);

  const onNext = () => {
    if (idx === 4) {
      setUnlockedAfterLow(true);
      setPhase({ kind: "step", index: 5 });
      return;
    }
    if (idx === 5) {
      setPhase({ kind: "step", index: 6 });
      return;
    }
    if (idx === 6) {
      const report = scoreAnswers(answers);
      setPhase({ kind: "result", report });
      return;
    }
    setPhase({ kind: "step", index: idx + 1 });
  };

  const onBack = () => {
    if (idx === 0) return;
    setPhase({ kind: "step", index: idx - 1 });
  };

  const displayTotal = totalSteps;
  const progressPct = ((stepNumber - 1) / displayTotal) * 100;

  return (
    <div ref={cardRef} className="scroll-mt-24 mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {stepNumber} of {displayTotal}
          </span>
          <span>{step.title}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <StepCard step={step} answers={answers} setAnswer={setAnswer} />

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={idx === 0}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!complete}>
          {idx === 4 ? "Continue" : idx === 6 ? "See My Result" : "Save and Continue"}
        </Button>
      </div>

      {!complete && (
        <p className="text-center text-sm text-muted-foreground">
          Please answer every question to continue. Use the optional details field where precision helps leadership review.
        </p>
      )}
    </div>
  );
}

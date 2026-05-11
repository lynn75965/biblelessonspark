import { useState } from "react";
import type { Answers, ResultType, ScoreReport } from "@/lib/curriculum-eval/types";
import { Button } from "@/components/ui/button";
import { DecisionBrief } from "./DecisionBrief";
import { PilotPlan } from "./PilotPlan";

interface Props {
  report: ScoreReport;
  answers: Answers;
  includeStep6: boolean;
  includeStep7: boolean;
  onScrollToClosing: () => void;
  onRestart: () => void;
}

interface ResultCopy {
  title: string;
  summary: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
}

const COPY: Record<ResultType, ResultCopy> = {
  personal: {
    title: "Personal Preparation May Be the Wisest Next Step",
    summary:
      "Your responses suggest that the church may not be ready for a church-wide curriculum transition yet. The wisest next step may be for one teacher or leader to begin personally preparing stronger, Scripture-true lessons and use that experience to learn, test, and demonstrate what local church curriculum preparation could offer.",
    primary: "Explore the Personal Plan",
    secondary: "Generate Decision Brief",
  },
  small_pilot: {
    title: "A Small Pilot May Be the Wisest First Step",
    summary:
      "Your responses suggest that leadership may be open to locally prepared curriculum, but a full transition would be premature. Begin with one class or one short study, keep traditional curriculum available, and require leadership review before use.",
    primary: "Build Pilot Plan",
    secondary: "Generate Decision Brief",
    tertiary: "Explore BibleLessonSpark",
  },
  department_pilot: {
    title: "A Department Pilot May Be Appropriate",
    summary:
      "Your responses suggest that leadership and teachers may be ready to test locally prepared curriculum within one department or ministry area. A department pilot can evaluate teacher preparation, member usefulness, print/digital distribution, and doctrinal review before broader adoption.",
    primary: "Generate Decision Brief",
    secondary: "Build Department Pilot Plan",
    tertiary: "Explore BibleLessonSpark",
  },
  full_quarter: {
    title: "Your Church May Be Ready for Full-Quarter Planning",
    summary:
      "Your responses suggest the church may be ready to plan a full 13-week locally prepared curriculum pilot, provided leadership review, teacher support, and distribution responsibilities are clearly assigned.",
    primary: "Generate Decision Brief",
    secondary: "Build Full-Quarter Pilot Plan",
    tertiary: "Explore BibleLessonSpark",
  },
};

export function Results({
  report,
  answers,
  includeStep6,
  includeStep7,
  onScrollToClosing,
  onRestart,
}: Props) {
  const copy = COPY[report.resultType];
  const [showBrief, setShowBrief] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const handleClick = (label: string) => {
    if (label === "Generate Decision Brief") {
      setShowBrief(true);
      return;
    }
    if (label.toLowerCase().includes("pilot plan")) {
      setShowPlan(true);
      return;
    }
    onScrollToClosing();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-2 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wider text-secondary-foreground">
          Evaluation result
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {copy.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {copy.summary}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => handleClick(copy.primary)}>{copy.primary}</Button>
          {copy.secondary && (
            <Button variant="outline" onClick={() => handleClick(copy.secondary!)}>
              {copy.secondary}
            </Button>
          )}
          {copy.tertiary && (
            <Button variant="ghost" onClick={() => handleClick(copy.tertiary!)}>
              {copy.tertiary}
            </Button>
          )}
        </div>
      </div>

      {showBrief && (
        <DecisionBrief
          report={report}
          answers={answers}
          includeStep6={includeStep6}
          includeStep7={includeStep7}
        />
      )}

      {showPlan && includeStep7 && (
        <PilotPlan report={report} answers={answers} />
      )}
      {showPlan && !includeStep7 && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          A detailed pilot plan needs answers from Step 7 (Pilot Planning). Use "Start over" and choose to continue through Step 7 to generate one.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          This evaluation is a guide, not a substitute for pastoral or doctrinal oversight.
        </p>
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Start over
        </Button>
      </div>
    </div>
  );
}

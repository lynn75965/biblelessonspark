import { useMemo, useState } from "react";
import type { Answers, ScoreReport } from "@/lib/curriculum-eval/types";
import { buildPilotPlan, pilotPlanToText } from "@/lib/curriculum-eval/pilot-plan";
import { exportTextAsPDF, exportTextAsDOCX } from "@/lib/curriculum-eval/export";
import { Button } from "@/components/ui/button";
import { Check, Copy, FileDown, FileText } from "lucide-react";

interface Props {
  answers: Answers;
  report: ScoreReport;
}

export function PilotPlan({ answers, report }: Props) {
  const plan = useMemo(() => buildPilotPlan(answers, report), [answers, report]);
  const text = useMemo(() => pilotPlanToText(plan), [plan]);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Pilot Plan</h3>
          <p className="text-sm text-muted-foreground">
            A practical, week-by-week plan based on your answers. Adjust to fit your church.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {copied ? (
              <><Check className="mr-2 h-4 w-4" /> Copied</>
            ) : (
              <><Copy className="mr-2 h-4 w-4" /> Copy</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTextAsPDF(text, "pilot-plan.pdf", plan.title)}
          >
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTextAsDOCX(text, "pilot-plan.docx", plan.title)}
          >
            <FileText className="mr-2 h-4 w-4" /> DOCX
          </Button>
        </div>
      </header>

      <div className="space-y-6 px-6 py-6 text-sm leading-relaxed text-foreground">
        <div>
          <h4 className="text-base font-semibold tracking-tight">{plan.title}</h4>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <div><dt className="inline font-medium">Size: </dt><dd className="inline text-muted-foreground">{plan.size}</dd></div>
            <div><dt className="inline font-medium">Length: </dt><dd className="inline text-muted-foreground">{plan.length}</dd></div>
            <div><dt className="inline font-medium">Delivery: </dt><dd className="inline text-muted-foreground">{plan.delivery}</dd></div>
            <div><dt className="inline font-medium">Reviewer: </dt><dd className="inline text-muted-foreground">{plan.reviewer}</dd></div>
            <div className="sm:col-span-2"><dt className="inline font-medium">Final approver: </dt><dd className="inline text-muted-foreground">{plan.approver}</dd></div>
          </dl>
        </div>

        <div>
          <h5 className="mb-3 font-semibold tracking-tight">Milestones</h5>
          <ol className="space-y-4 border-l-2 border-border pl-5">
            {plan.milestones.map((m, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                <p className="font-medium text-foreground">{m.week}</p>
                <p className="text-foreground">{m.title}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Owner: {m.owner}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {m.tasks.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h5 className="mb-2 font-semibold tracking-tight">Success criteria</h5>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {plan.successCriteria.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        <div>
          <h5 className="mb-2 font-semibold tracking-tight">Risks to watch</h5>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {plan.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        <p className="border-t border-border pt-4 text-xs italic text-muted-foreground">
          This plan is a starting point for leadership conversation, not a fixed requirement. Adjust scope, owners, and timing to fit your church's pace and pastoral oversight.
        </p>
      </div>
    </section>
  );
}

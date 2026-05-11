import { useMemo, useState } from "react";
import { buildDecisionBrief } from "@/lib/curriculum-eval/brief";
import { exportTextAsPDF, exportTextAsDOCX } from "@/lib/curriculum-eval/export";
import type { Answers, ScoreReport } from "@/lib/curriculum-eval/types";
import { Button } from "@/components/ui/button";
import { Check, Copy, FileDown, FileText } from "lucide-react";

interface Props {
  report: ScoreReport;
  answers: Answers;
  includeStep6: boolean;
  includeStep7: boolean;
}

export function DecisionBrief({ report, answers, includeStep6, includeStep7 }: Props) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(
    () => buildDecisionBrief(answers, report, { includeStep6, includeStep7 }),
    [answers, report, includeStep6, includeStep7],
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Decision Brief</h3>
          <p className="text-sm text-muted-foreground">A leadership-facing summary of this evaluation.</p>
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
            onClick={() => exportTextAsPDF(text, "decision-brief.pdf", "Church Curriculum Evaluation -- Decision Brief")}
          >
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTextAsDOCX(text, "decision-brief.docx", "Church Curriculum Evaluation -- Decision Brief")}
          >
            <FileText className="mr-2 h-4 w-4" /> DOCX
          </Button>
        </div>
      </header>
      <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words px-6 py-5 font-sans text-sm leading-relaxed text-foreground">
        {text}
      </pre>
    </section>
  );
}

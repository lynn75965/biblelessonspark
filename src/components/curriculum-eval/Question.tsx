import { useState } from "react";
import type { Answer, Question as QuestionT } from "@/lib/curriculum-eval/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  question: QuestionT;
  index: number;
  answer?: Answer;
  onChange: (a: Answer) => void;
}

export function Question({ question, index, answer, onChange }: Props) {
  const [showDetails, setShowDetails] = useState(!!answer?.details);

  const setValue = (value: string | string[]) => {
    onChange({ value, details: answer?.details });
  };
  const setDetails = (details: string) => {
    onChange({ value: answer?.value ?? (question.type === "checkbox" ? [] : ""), details });
  };

  return (
    <fieldset className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <legend className="text-base font-medium text-foreground">
        <span className="mr-2 text-muted-foreground">{index}.</span>
        {question.prompt}
      </legend>

      {question.type === "radio" ? (
        <RadioGroup
          value={(answer?.value as string) || ""}
          onValueChange={(v) => setValue(v)}
          className="space-y-2"
        >
          {question.options.map((opt) => {
            const id = `${question.id}_${opt.value}`;
            return (
              <div key={opt.value} className="flex items-start gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:bg-accent">
                <RadioGroupItem id={id} value={opt.value} className="mt-0.5" />
                <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-relaxed text-foreground">
                  {opt.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const id = `${question.id}_${opt.value}`;
            const current = (answer?.value as string[]) || [];
            const checked = current.includes(opt.value);
            return (
              <div key={opt.value} className="flex items-start gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:bg-accent">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...current, opt.value]
                      : current.filter((v) => v !== opt.value);
                    setValue(next);
                  }}
                  className="mt-0.5"
                />
                <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-relaxed text-foreground">
                  {opt.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Add details if precision is needed
      </button>
      {showDetails && (
        <Textarea
          value={answer?.details ?? ""}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Optional context for leadership review..."
          className="min-h-[80px]"
        />
      )}
    </fieldset>
  );
}

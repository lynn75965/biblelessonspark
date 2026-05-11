import type { Step, Answers, Answer } from "@/lib/curriculum-eval/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Question } from "./Question";

interface Props {
  step: Step;
  answers: Answers;
  setAnswer: (qid: string, a: Answer) => void;
}

export function StepCard({ step, answers, setAnswer }: Props) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-semibold tracking-tight">{step.title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{step.purpose}</CardDescription>
        <p className="rounded-md border-l-2 border-primary/50 bg-secondary/40 px-4 py-2 text-sm italic leading-relaxed text-muted-foreground">
          There are no right or wrong answers here. Answer honestly for your specific church -- the value of the result depends on it.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {step.questions.map((q, i) => (
          <Question
            key={q.id}
            question={q}
            index={i + 1}
            answer={answers[q.id]}
            onChange={(a) => setAnswer(q.id, a)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

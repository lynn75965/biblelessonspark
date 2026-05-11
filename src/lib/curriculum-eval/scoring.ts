import { STEPS } from "./schema";
import type {
  Answers,
  Category,
  ResultType,
  ScoreReport,
  Tier,
} from "./types";

const ALL_CATS: Category[] = [
  "scripture",
  "objectives",
  "teaching",
  "leadership",
  "transition",
  "print",
  "digital",
  "pilot",
];

export function scoreAnswers(answers: Answers): ScoreReport {
  const sums: Record<Category, number> = Object.fromEntries(
    ALL_CATS.map((c) => [c, 0]),
  ) as Record<Category, number>;
  const counts: Record<Category, number> = Object.fromEntries(
    ALL_CATS.map((c) => [c, 0]),
  ) as Record<Category, number>;

  for (const step of STEPS) {
    for (const q of step.questions) {
      const ans = answers[q.id];
      if (!ans) continue;
      const values = Array.isArray(ans.value) ? ans.value : [ans.value];
      for (const v of values) {
        const opt = q.options.find((o) => o.value === v);
        if (!opt?.scores) continue;
        for (const cat of Object.keys(opt.scores) as Category[]) {
          const s = opt.scores[cat];
          if (s === undefined) continue;
          sums[cat] += s;
          counts[cat] += 1;
        }
      }
    }
  }

  const categoryScores: Record<Category, number> = Object.fromEntries(
    ALL_CATS.map((c) => [c, counts[c] > 0 ? sums[c] / (counts[c] * 4) : 0]),
  ) as Record<Category, number>;

  const transitionReadiness = tierFor(categoryScores.transition);

  const overall =
    categoryScores.transition * 0.5 +
    categoryScores.leadership * 0.2 +
    categoryScores.scripture * 0.15 +
    categoryScores.teaching * 0.15;
  const overallTier = tierFor(overall);

  const resultType = pickResultType(answers, transitionReadiness, overallTier);

  return {
    categoryScores,
    transitionReadiness,
    overallTier,
    resultType,
  };
}

function tierFor(v: number): Tier {
  if (v < 0.4) return "low";
  if (v < 0.7) return "moderate";
  return "high";
}

function pickResultType(
  answers: Answers,
  transition: Tier,
  overall: Tier,
): ResultType {
  if (transition === "low") return "personal";

  const classes = answers["q4_2"]?.value as string | undefined;
  const manyClasses = classes === "C" || classes === "D" || classes === "E";

  if (transition === "high" && overall === "high" && manyClasses) {
    return "full_quarter";
  }
  if (transition === "high" && manyClasses) return "department_pilot";
  if (transition === "high") return "small_pilot";
  if (manyClasses) return "department_pilot";
  return "small_pilot";
}

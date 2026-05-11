import { STEPS, STEP_BY_ID } from "./schema";
import type { Answers, ResultType, ScoreReport } from "./types";

function answerLabel(stepId: string, qid: string, value: string): string {
  const step = STEP_BY_ID[stepId];
  const q = step?.questions.find((x) => x.id === qid);
  const opt = q?.options.find((o) => o.value === value);
  return opt?.label ?? value;
}

function readableAnswer(qid: string, answers: Answers): string | null {
  for (const step of STEPS) {
    const q = step.questions.find((x) => x.id === qid);
    if (!q) continue;
    const a = answers[qid];
    if (!a) return null;
    if (Array.isArray(a.value)) {
      if (a.value.length === 0) return null;
      return a.value
        .map((v) => q.options.find((o) => o.value === v)?.label ?? v)
        .join("; ");
    }
    return answerLabel(step.id, qid, a.value as string);
  }
  return null;
}

function tierWord(t: ScoreReport["transitionReadiness"]): string {
  return t === "low" ? "low" : t === "moderate" ? "moderate" : "high";
}

function resultTitle(rt: ResultType): string {
  switch (rt) {
    case "personal":
      return "Personal Preparation Recommended";
    case "small_pilot":
      return "A Small Pilot May Be the Wisest First Step";
    case "department_pilot":
      return "A Department Pilot May Be Appropriate";
    case "full_quarter":
      return "Full-Quarter Planning May Be Appropriate";
  }
}

function recommendedNextStep(rt: ResultType): string {
  switch (rt) {
    case "personal":
      return "Begin with personal lesson preparation. Use BibleLessonSpark personally to prepare stronger, Scripture-true lessons for your own class or ministry area before considering a church-wide change.";
    case "small_pilot":
      return "Plan a small pilot in one class or one short study, keep traditional curriculum available, and require leadership review before any locally prepared lesson is used.";
    case "department_pilot":
      return "Plan a department pilot within one ministry area to evaluate teacher preparation, member usefulness, print/digital distribution, and doctrinal review before broader adoption.";
    case "full_quarter":
      return "Plan a full 13-week locally prepared curriculum pilot, with leadership review, teacher support, and distribution responsibilities clearly assigned.";
  }
}

function decisionLanguage(rt: ResultType): string {
  if (rt === "personal") {
    return "Leadership encourages selected teachers or ministry leaders to begin personal lesson preparation, with materials reviewed informally before classroom use, while traditional curriculum remains in place.";
  }
  return "Leadership approves a limited curriculum publishing pilot for selected classes, with final lesson review required before distribution and teacher/member feedback gathered before any broader implementation.";
}

function bullet(label: string, value: string | null): string {
  if (!value) return `- ${label}: (no answer)`;
  return `- ${label}: ${value}`;
}

export function buildDecisionBrief(
  answers: Answers,
  report: ScoreReport,
  options: { includeStep6: boolean; includeStep7: boolean },
): string {
  const lines: string[] = [];

  lines.push("Church Curriculum Evaluation -- Decision Brief");
  lines.push("");
  lines.push("Purpose of Evaluation");
  lines.push(
    "This brief summarizes a guided evaluation of whether locally prepared, church-specific Bible curriculum may serve this church better than, or alongside, traditional published curriculum. It is intended to support -- not replace -- pastoral, leadership, and doctrinal oversight.",
  );
  lines.push("");

  lines.push("Overall Readiness Finding");
  lines.push(
    `Transition readiness: ${tierWord(report.transitionReadiness)}. Overall tier: ${tierWord(
      report.overallTier,
    )}. Recommended path: ${resultTitle(report.resultType)}.`,
  );
  lines.push("");

  lines.push("Scripture and Doctrine");
  lines.push(bullet("Lessons Bible-based", readableAnswer("q1_1", answers)));
  lines.push(bullet("Lessons true to Scripture", readableAnswer("q1_2", answers)));
  lines.push(bullet("Lessons aligned with church doctrine", readableAnswer("q1_3", answers)));
  lines.push(bullet("Lesson reviewer", readableAnswer("q1_4", answers)));
  lines.push("");

  lines.push("Leadership-Defined Discipleship Objectives");
  lines.push(bullet("Objectives defined", readableAnswer("q2_1", answers)));
  lines.push(bullet("Lessons aligned with objectives", readableAnswer("q2_2", answers)));
  lines.push(bullet("Guidance to teachers", readableAnswer("q2_3", answers)));
  lines.push("");

  lines.push("Current Teaching Alignment and Teacher Support");
  lines.push(bullet("Greatest concerns", readableAnswer("q3_1", answers)));
  lines.push(bullet("Teacher readiness", readableAnswer("q3_2", answers)));
  lines.push(bullet("Greatest support need", readableAnswer("q3_3", answers)));
  lines.push(bullet("Typical preparation time", readableAnswer("q3_4", answers)));
  lines.push("");

  lines.push("Church Setting and Leadership");
  lines.push(bullet("Church setting", readableAnswer("q4_1", answers)));
  lines.push(bullet("Weekly classes", readableAnswer("q4_2", answers)));
  lines.push(bullet("Age groups", readableAnswer("q4_3", answers)));
  lines.push(bullet("Curriculum chosen by", readableAnswer("q4_4", answers)));
  lines.push(bullet("Final approval", readableAnswer("q4_5", answers)));
  lines.push("");

  lines.push("Transition Readiness");
  lines.push(bullet("Leadership readiness", readableAnswer("q5_1", answers)));
  lines.push(bullet("Teacher readiness", readableAnswer("q5_2", answers)));
  lines.push(bullet("Member readiness", readableAnswer("q5_3", answers)));
  lines.push(bullet("Dependence on traditional curriculum", readableAnswer("q5_4", answers)));
  lines.push(bullet("Greatest concerns about change", readableAnswer("q5_5", answers)));
  lines.push("");

  if (options.includeStep6) {
    lines.push("Print and Digital Readiness");
    lines.push(bullet("Reliable printing access", readableAnswer("q6_1", answers)));
    lines.push(bullet("Print/assembly responsibility", readableAnswer("q6_2", answers)));
    lines.push(bullet("Teacher digital comfort", readableAnswer("q6_3", answers)));
    lines.push(bullet("Member digital comfort", readableAnswer("q6_4", answers)));
    lines.push(bullet("Workable digital methods", readableAnswer("q6_5", answers)));
    lines.push("");
  }

  if (options.includeStep7) {
    lines.push("Recommended Pilot");
    lines.push(bullet("Pilot size", readableAnswer("q7_1", answers)));
    lines.push(bullet("Pilot length", readableAnswer("q7_2", answers)));
    lines.push(bullet("Delivery model", readableAnswer("q7_3", answers)));
    lines.push(bullet("Evaluation focus", readableAnswer("q7_4", answers)));
    lines.push("");
  }

  lines.push("Risks to Address First");
  const risks: string[] = [];
  if (report.categoryScores.scripture < 0.6)
    risks.push("Strengthen Scripture and doctrinal review process before any change.");
  if (report.categoryScores.objectives < 0.6)
    risks.push("Clarify leadership-defined discipleship objectives for each age group.");
  if (report.categoryScores.leadership < 0.6)
    risks.push("Identify a clear reviewer/approver for any locally prepared lesson.");
  if (report.categoryScores.teaching < 0.6)
    risks.push("Provide additional teacher preparation support before expanding scope.");
  if (report.categoryScores.transition < 0.4)
    risks.push("Avoid a church-wide change; begin with personal preparation only.");
  if (options.includeStep6 && report.categoryScores.print < 0.5 && report.categoryScores.digital < 0.5)
    risks.push("Confirm a workable print or digital distribution path before launching a pilot.");
  if (risks.length === 0) risks.push("No major risks flagged by this evaluation.");
  for (const r of risks) lines.push(`- ${r}`);
  lines.push("");

  lines.push("Suggested Next Step");
  lines.push(recommendedNextStep(report.resultType));
  lines.push("");

  lines.push("Suggested Decision Language");
  lines.push(decisionLanguage(report.resultType));

  return lines.join("\n");
}

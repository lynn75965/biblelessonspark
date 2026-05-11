import { STEPS } from "./schema";
import type { Answers, ResultType, ScoreReport } from "./types";

export interface PilotMilestone {
  week: string;
  title: string;
  owner: string;
  tasks: string[];
}

export interface PilotPlan {
  title: string;
  size: string;
  length: string;
  weeks: number;
  delivery: string;
  evaluationFocus: string[];
  reviewer: string;
  approver: string;
  milestones: PilotMilestone[];
  successCriteria: string[];
  risks: string[];
}

function labelFor(qid: string, value: string | undefined): string {
  if (!value) return "Not specified";
  for (const s of STEPS) {
    const q = s.questions.find((x) => x.id === qid);
    if (!q) continue;
    return q.options.find((o) => o.value === value)?.label ?? "Not specified";
  }
  return "Not specified";
}

function labelsFor(qid: string, values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  for (const s of STEPS) {
    const q = s.questions.find((x) => x.id === qid);
    if (!q) continue;
    return values.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
  }
  return [];
}

function weeksFromLength(v: string | undefined): number {
  switch (v) {
    case "A": return 1;
    case "B": return 2;
    case "C": return 4;
    case "D": return 6;
    case "E": return 13;
    default: return 4;
  }
}

function pilotTitleFor(rt: ResultType, sizeLabel: string, weeks: number): string {
  switch (rt) {
    case "personal":
      return `Personal Preparation Plan -- ${weeks}-Week Trial`;
    case "small_pilot":
      return `Small Pilot Plan -- ${sizeLabel}, ${weeks} Weeks`;
    case "department_pilot":
      return `Department Pilot Plan -- ${sizeLabel}, ${weeks} Weeks`;
    case "full_quarter":
      return `Full-Quarter Pilot Plan -- ${sizeLabel}, ${weeks} Weeks`;
  }
}

export function buildPilotPlan(answers: Answers, report: ScoreReport): PilotPlan {
  const sizeLabel = labelFor("q7_1", answers.q7_1?.value as string);
  const lengthLabel = labelFor("q7_2", answers.q7_2?.value as string);
  const deliveryLabel = labelFor("q7_3", answers.q7_3?.value as string);
  const focusLabels = labelsFor("q7_4", answers.q7_4?.value as string[]);
  const reviewerLabel = labelFor("q1_4", answers.q1_4?.value as string);
  const approverLabel = labelFor("q4_5", answers.q4_5?.value as string);

  const weeks = weeksFromLength(answers.q7_2?.value as string);
  const title = pilotTitleFor(report.resultType, sizeLabel, weeks);

  const milestones: PilotMilestone[] = [];

  milestones.push({
    week: "Week 0 -- Preparation",
    title: "Leadership alignment and reviewer confirmation",
    owner: approverLabel,
    tasks: [
      `Confirm ${approverLabel.toLowerCase()} as the final approver for any locally prepared lesson.`,
      `Confirm ${reviewerLabel.toLowerCase()} as the doctrinal/Scripture reviewer for each lesson before classroom use.`,
      "Communicate the pilot scope and purpose to participating teachers and the affected class(es).",
      "Keep traditional published curriculum available throughout the pilot.",
    ],
  });

  for (let i = 1; i <= weeks; i++) {
    const isMidpoint = weeks >= 4 && i === Math.ceil(weeks / 2);
    milestones.push({
      week: `Week ${i}`,
      title: isMidpoint ? "Teaching week + mid-pilot review" : "Teaching week",
      owner: "Teachers and reviewer",
      tasks: [
        "Lesson drafted, reviewed against Scripture and church doctrine, and approved before use.",
        `Lesson distributed via: ${deliveryLabel.toLowerCase()}.`,
        "Teacher records preparation time and any concerns.",
        ...(isMidpoint
          ? ["Mid-pilot check-in: gather teacher and member feedback; adjust before continuing."]
          : []),
      ],
    });
  }

  milestones.push({
    week: `Week ${weeks + 1} -- Review`,
    title: "Pilot evaluation and decision",
    owner: approverLabel,
    tasks: [
      "Gather written feedback from each participating teacher.",
      "Gather informal feedback from class members.",
      `Evaluate against the pilot focus areas: ${focusLabels.join(", ") || "(none specified)"}.`,
      "Decide: continue as-is, expand scope, adjust process, or return to traditional curriculum.",
    ],
  });

  const successCriteria = [
    "Every lesson used in the pilot was reviewed and approved before classroom use.",
    "Teachers report preparation time is sustainable.",
    "Class members report the lessons were Scripture-true and clear.",
    "No doctrinal concerns were raised by leadership during the pilot.",
    ...(focusLabels.length > 0
      ? [`Each named focus area was observed and discussed: ${focusLabels.join(", ")}.`]
      : []),
  ];

  const risks: string[] = [];
  if (report.categoryScores.scripture < 0.6)
    risks.push("Scripture / doctrinal review process is still being strengthened -- keep review tight.");
  if (report.categoryScores.leadership < 0.6)
    risks.push("Approval line is not yet fully clear -- confirm in writing before Week 1.");
  if (report.categoryScores.teaching < 0.6)
    risks.push("Teacher preparation support is limited -- keep pilot small and provide extra help.");
  if (report.categoryScores.print < 0.5 && report.categoryScores.digital < 0.5)
    risks.push("Distribution path is uncertain -- confirm print or digital plan before Week 1.");
  if (risks.length === 0)
    risks.push("No major risks flagged by this evaluation -- proceed with normal pastoral oversight.");

  return {
    title,
    size: sizeLabel,
    length: lengthLabel,
    weeks,
    delivery: deliveryLabel,
    evaluationFocus: focusLabels,
    reviewer: reviewerLabel,
    approver: approverLabel,
    milestones,
    successCriteria,
    risks,
  };
}

export function pilotPlanToText(plan: PilotPlan): string {
  const lines: string[] = [];
  lines.push(plan.title);
  lines.push("");
  lines.push("Pilot Overview");
  lines.push(`- Size: ${plan.size}`);
  lines.push(`- Length: ${plan.length} (${plan.weeks} teaching weeks)`);
  lines.push(`- Delivery: ${plan.delivery}`);
  lines.push(`- Reviewer: ${plan.reviewer}`);
  lines.push(`- Final approver: ${plan.approver}`);
  if (plan.evaluationFocus.length > 0) {
    lines.push(`- Evaluation focus: ${plan.evaluationFocus.join("; ")}`);
  }
  lines.push("");
  lines.push("Milestones");
  for (const m of plan.milestones) {
    lines.push(`${m.week} -- ${m.title} (owner: ${m.owner})`);
    for (const t of m.tasks) lines.push(`  - ${t}`);
    lines.push("");
  }
  lines.push("Success Criteria");
  for (const s of plan.successCriteria) lines.push(`- ${s}`);
  lines.push("");
  lines.push("Risks to Watch");
  for (const r of plan.risks) lines.push(`- ${r}`);
  return lines.join("\n");
}

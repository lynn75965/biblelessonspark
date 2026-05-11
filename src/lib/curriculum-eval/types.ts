export type QuestionType = "radio" | "checkbox";

export type Category =
  | "scripture"
  | "objectives"
  | "teaching"
  | "leadership"
  | "transition"
  | "print"
  | "digital"
  | "pilot";

export interface Option {
  value: string;
  label: string;
  scores?: Partial<Record<Category, number>>;
}

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  options: Option[];
  categories: Category[];
}

export interface Step {
  id: string;
  title: string;
  purpose: string;
  questions: Question[];
}

export type AnswerValue = string | string[];

export interface Answer {
  value: AnswerValue;
  details?: string;
}

export type Answers = Record<string, Answer>;

export type Tier = "low" | "moderate" | "high";

export type ResultType =
  | "personal"
  | "small_pilot"
  | "department_pilot"
  | "full_quarter";

export interface ScoreReport {
  categoryScores: Record<Category, number>;
  transitionReadiness: Tier;
  overallTier: Tier;
  resultType: ResultType;
}

export interface ParableGuardrails {
  big_question: string
  real_life_trigger: "mortality" | "aging" | "irreversible" | "general"
  emotional_posture: string
  intended_outcome: string
}

export function deriveParableGuardrails(
  biblePassage?: string,
  focusPoint?: string,
  ageGroupName?: string,
  audienceLensName?: string
): ParableGuardrails {

  const passage = (biblePassage || "").toLowerCase()
  const focus = (focusPoint || "").toLowerCase()
  const age = (ageGroupName || "").toLowerCase()
  const lens = (audienceLensName || "").toLowerCase()

  // DEFAULT (safe, non-drifting)
  let guardrails: ParableGuardrails = {
    big_question: "What does God require of me in light of this Scripture?",
    real_life_trigger: "general",
    emotional_posture: "Attentive",
    intended_outcome: "Clear biblical understanding"
  }

  // JOB 14:5 — NUMBERED DAYS / HUMAN LIMITS
  const isJob14 =
    passage.includes("job 14") ||
    passage.includes("job 14:5") ||
    (passage.includes("numbered") && passage.includes("days")) ||
    focus.includes("day that is coming")

  if (isJob14) {
    guardrails = {
      big_question:
        "My days are limited, and God alone determines their boundary — how should I live now?",
      real_life_trigger: "mortality",
      emotional_posture:
        age.includes("66") || age.includes("senior")
          ? "Quietly reflective"
          : "Sober and serious",
      intended_outcome:
        "Sober clarity and peaceful trust in God’s sovereign limits"
    }
  }

  // Audience lens nuance (tone only — never override trigger)
  if (lens.includes("spiritually exhausted")) {
    guardrails.emotional_posture = "Weary but still listening"
  }

  return guardrails
}

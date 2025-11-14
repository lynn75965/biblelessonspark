// SOURCE OF TRUTH: These constants are shared between frontend and backend
// MUST stay in sync with src/lib/constants.ts

export const AGE_GROUP_OPTIONS = [
  'Preschoolers (Ages 3–5)',
  'Elementary Kids (Ages 6–10)',
  'Preteens & Middle Schoolers (Ages 11–14)',
  'High School Students (Ages 15–18)',
  'College & Early Career (Ages 19–25)',
  'Young Adults (Ages 26–35)',
  'Mid-Life Adults (Ages 36–50)',
  'Mature Adults (Ages 51–65)',
  'Active Seniors (Ages 66–75)',
  'Senior Adults (Ages 76+)',
  'Mixed Groups'
] as const;

export type AgeGroup = typeof AGE_GROUP_OPTIONS[number];
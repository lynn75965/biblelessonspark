// SOURCE OF TRUTH: Age group constants
// MUST stay in sync with supabase/functions/_shared/constants.ts

export const AGE_GROUP_OPTIONS = [
  'Preschoolers (Ages 3-5)',
  'Elementary Kids (Ages 6-10)',
  'Preteens & Middle Schoolers (Ages 11-14)',
  'High School Students (Ages 15-18)',
  'College & Early Career (Ages 19-25)',
  'Young Adults (Ages 26-35)',
  'Mid-Life Adults (Ages 36-50)',
  'Mature Adults (Ages 51-65)',
  'Active Seniors (Ages 66-75)',
  'Senior Adults (Ages 76+)',
  'Mixed Groups'
] as const;

export type AgeGroup = typeof AGE_GROUP_OPTIONS[number];

export const AGE_GROUP_DESCRIPTIONS: Record<string, string> = {
  'Preschoolers (Ages 3-5)': 'Concrete learning through play and sensory experiences.',
  'Elementary Kids (Ages 6-10)': 'Growing in understanding with foundational Bible teachings.',
  'Preteens & Middle Schoolers (Ages 11-14)': 'Developing critical thinking and faith ownership.',
  'High School Students (Ages 15-18)': 'Exploring deeper theological concepts and apologetics.',
  'College & Early Career (Ages 19-25)': 'Navigating independence and life transitions.',
  'Young Adults (Ages 26-35)': 'Balancing career, relationships, and spiritual growth.',
  'Mid-Life Adults (Ages 36-50)': 'Leading families and serving in ministry roles.',
  'Mature Adults (Ages 51-65)': 'Wisdom-sharing and mentoring the next generation.',
  'Active Seniors (Ages 66-75)': 'Continuing active service and prayer ministry.',
  'Senior Adults (Ages 76+)': 'Modeling lifelong faithfulness and leaving a legacy.',
  'Mixed Groups': 'Multi-generational learning and fellowship.'
};

export function getDefaultAgeGroup(): string {
  return 'Young Adults (Ages 26-35)';
}
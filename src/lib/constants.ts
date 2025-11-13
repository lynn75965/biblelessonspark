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

// Descriptions for each age group (optional, for tooltips or help text)
export const AGE_GROUP_DESCRIPTIONS: Record<string, string> = {
  'Preschoolers (Ages 3–5)': 'Early learners beginning to explore faith through stories and play.',
  'Elementary Kids (Ages 6–10)': 'Growing in understanding with foundational Bible teachings.',
  'Preteens & Middle Schoolers (Ages 11–14)': 'Developing identity and engaging with deeper biblical truths.',
  'High School Students (Ages 15–18)': 'Forming convictions, seeking purpose, and growing in personal faith.',
  'College & Early Career (Ages 19–25)': 'Navigating independence, relationships, and faith in real life.',
  'Young Adults (Ages 26–35)': 'Building careers, families, and deepening spiritual commitment.',
  'Mid-Life Adults (Ages 36–50)': 'Balancing life responsibilities with intentional spiritual growth.',
  'Mature Adults (Ages 51–65)': 'Sharing wisdom, mentoring others, and embracing purposeful faith.',
  'Active Seniors (Ages 66–75)': 'Thriving in retirement with time to serve and connect spiritually.',
  'Senior Adults (Ages 76+)': 'Living legacy-makers offering guidance, prayer, and fellowship.',
  'Mixed Groups': 'Multi-generational groups learning and growing together.'
};

// Helper function to get default age group
export const getDefaultAgeGroup = (): AgeGroup => 'Young Adults (Ages 26–35)';

// Helper to get short display name (without age range)
export const getShortAgeGroupName = (ageGroup: AgeGroup): string => {
  return ageGroup.split('(')[0].trim();
};

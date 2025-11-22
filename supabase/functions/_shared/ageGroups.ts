/**
 * LessonSparkUSA Constants - Age Groups
 *
 * SINGLE SOURCE OF TRUTH for all age group data.
 * Includes display labels, descriptions, and teaching profiles.
 *
 * GOVERNANCE: Only admin can modify these constants.
 * Frontend displays these options; backend looks up by ID.
 *
 * @version 1.0.0
 * @lastUpdated 2025-11-21
 */

import type { AgeGroup, TeachingProfile } from './contracts';

// ============================================================
// AGE GROUP DEFINITIONS
// ============================================================

export const AGE_GROUPS: AgeGroup[] = [
  {
    id: 'preschool',
    label: 'Preschoolers (Ages 3-5)',
    ageMin: 3,
    ageMax: 5,
    description: 'Concrete learning through play and sensory experiences.',
    teachingProfile: {
      vocabularyLevel: 'simple',
      attentionSpan: 5,
      preferredActivities: [
        'songs with motions',
        'coloring pages',
        'simple crafts',
        'puppet shows',
        'interactive storytelling',
        'movement activities'
      ],
      abstractThinking: 'concrete',
      specialConsiderations: [
        'Use repetition for memory retention',
        'Keep instructions to one step at a time',
        'Include bathroom and snack breaks',
        'Use large visuals and manipulatives',
        'Focus on God\'s love and care themes'
      ]
    }
  },
  {
    id: 'elementary',
    label: 'Elementary Kids (Ages 6-10)',
    ageMin: 6,
    ageMax: 10,
    description: 'Growing in understanding with foundational Bible teachings.',
    teachingProfile: {
      vocabularyLevel: 'simple',
      attentionSpan: 12,
      preferredActivities: [
        'Bible drills',
        'group games',
        'crafts with purpose',
        'dramatic skits',
        'fill-in-the-blank worksheets',
        'memory verse competitions'
      ],
      abstractThinking: 'emerging',
      specialConsiderations: [
        'Mix seated and active learning',
        'Use concrete examples before abstract concepts',
        'Encourage Bible memorization',
        'Celebrate participation and effort',
        'Connect lessons to daily life situations'
      ]
    }
  },
  {
    id: 'preteen',
    label: 'Preteens & Middle Schoolers (Ages 11-14)',
    ageMin: 11,
    ageMax: 14,
    description: 'Developing critical thinking and faith ownership.',
    teachingProfile: {
      vocabularyLevel: 'moderate',
      attentionSpan: 18,
      preferredActivities: [
        'small group discussions',
        'case studies',
        'multimedia presentations',
        'journaling',
        'service projects',
        'peer teaching opportunities'
      ],
      abstractThinking: 'emerging',
      specialConsiderations: [
        'Address identity and belonging questions',
        'Create safe space for doubt and questions',
        'Use relevant cultural illustrations',
        'Balance fun with meaningful content',
        'Encourage peer relationships within faith community'
      ]
    }
  },
  {
    id: 'highschool',
    label: 'High School Students (Ages 15-18)',
    ageMin: 15,
    ageMax: 18,
    description: 'Exploring deeper theological concepts and apologetics.',
    teachingProfile: {
      vocabularyLevel: 'moderate',
      attentionSpan: 25,
      preferredActivities: [
        'debates and discussions',
        'apologetics exercises',
        'video analysis',
        'research projects',
        'testimony sharing',
        'real-world application scenarios'
      ],
      abstractThinking: 'developing',
      specialConsiderations: [
        'Address worldview challenges directly',
        'Prepare for college faith transitions',
        'Discuss cultural and ethical issues biblically',
        'Encourage leadership and mentoring roles',
        'Connect faith to future career and life decisions'
      ]
    }
  },
  {
    id: 'college',
    label: 'College & Early Career (Ages 19-25)',
    ageMin: 19,
    ageMax: 25,
    description: 'Navigating independence and life transitions.',
    teachingProfile: {
      vocabularyLevel: 'advanced',
      attentionSpan: 30,
      preferredActivities: [
        'Socratic discussions',
        'book studies',
        'guest speakers',
        'accountability groups',
        'service and mission opportunities',
        'career-faith integration workshops'
      ],
      abstractThinking: 'developing',
      specialConsiderations: [
        'Address doubts from academic environments',
        'Discuss dating, marriage, and purity biblically',
        'Navigate career calling and purpose',
        'Build habits for lifelong faith practice',
        'Foster authentic Christian community'
      ]
    }
  },
  {
    id: 'youngadult',
    label: 'Young Adults (Ages 26-35)',
    ageMin: 26,
    ageMax: 35,
    description: 'Balancing career, relationships, and spiritual growth.',
    teachingProfile: {
      vocabularyLevel: 'advanced',
      attentionSpan: 35,
      preferredActivities: [
        'discussion-based learning',
        'couples and singles tracks',
        'parenting workshops',
        'financial stewardship studies',
        'mentorship programs',
        'community service projects'
      ],
      abstractThinking: 'mature',
      specialConsiderations: [
        'Address marriage and family challenges',
        'Balance busy schedules with spiritual disciplines',
        'Discuss workplace faith integration',
        'Encourage church involvement and service',
        'Support those in various life stages (single, married, parents)'
      ]
    }
  },
  {
    id: 'midlife',
    label: 'Mid-Life Adults (Ages 36-50)',
    ageMin: 36,
    ageMax: 50,
    description: 'Leading families and serving in ministry roles.',
    teachingProfile: {
      vocabularyLevel: 'advanced',
      attentionSpan: 40,
      preferredActivities: [
        'in-depth Bible studies',
        'leadership development',
        'family ministry integration',
        'theological discussions',
        'prayer partnerships',
        'intergenerational mentoring'
      ],
      abstractThinking: 'mature',
      specialConsiderations: [
        'Address parenting teens and young adults',
        'Navigate career peaks and transitions',
        'Support those caring for aging parents',
        'Encourage legacy and kingdom investment thinking',
        'Develop as teachers and leaders in the church'
      ]
    }
  },
  {
    id: 'experienced',
    label: 'Experienced Adults (Ages 51-65)',
    ageMin: 51,
    ageMax: 65,
    description: 'Wisdom-sharing and mentoring the next generation.',
    teachingProfile: {
      vocabularyLevel: 'advanced',
      attentionSpan: 40,
      preferredActivities: [
        'verse-by-verse studies',
        'historical and cultural context exploration',
        'testimony and wisdom sharing',
        'prayer ministry',
        'mentoring younger believers',
        'mission trip participation'
      ],
      abstractThinking: 'mature',
      specialConsiderations: [
        'Honor accumulated life experience',
        'Address empty nest transitions',
        'Prepare for retirement with purpose',
        'Encourage continued growth and service',
        'Support those facing health challenges'
      ]
    }
  },
  {
    id: 'activesenior',
    label: 'Active Seniors (Ages 66-75)',
    ageMin: 66,
    ageMax: 75,
    description: 'Continuing active service and prayer ministry.',
    teachingProfile: {
      vocabularyLevel: 'advanced',
      attentionSpan: 35,
      preferredActivities: [
        'traditional Bible studies',
        'hymn and Scripture meditation',
        'prayer groups',
        'visitation ministry training',
        'grandparenting discussions',
        'legacy and testimony writing'
      ],
      abstractThinking: 'mature',
      specialConsiderations: [
        'Accommodate varying mobility levels',
        'Use larger print materials',
        'Honor their role as church pillars',
        'Address grief and loss biblically',
        'Encourage ongoing kingdom contribution'
      ]
    }
  },
  {
    id: 'senior',
    label: 'Senior Adults (Ages 76+)',
    ageMin: 76,
    ageMax: 100,
    description: 'Modeling lifelong faithfulness and leaving a legacy.',
    teachingProfile: {
      vocabularyLevel: 'moderate',
      attentionSpan: 25,
      preferredActivities: [
        'familiar hymns and passages',
        'reminiscence and testimony sharing',
        'devotional readings',
        'prayer ministry',
        'one-on-one conversations',
        'audio and video resources'
      ],
      abstractThinking: 'mature',
      specialConsiderations: [
        'Accommodate hearing and vision needs',
        'Provide comfortable seating arrangements',
        'Use familiar translations and hymns',
        'Address end-of-life hope and assurance',
        'Honor their faithfulness and legacy'
      ]
    }
  },
  {
    id: 'mixed',
    label: 'Mixed Groups',
    ageMin: 0,
    ageMax: 100,
    description: 'Multi-generational learning and fellowship.',
    teachingProfile: {
      vocabularyLevel: 'moderate',
      attentionSpan: 20,
      preferredActivities: [
        'intergenerational activities',
        'shared meals and fellowship',
        'all-ages worship elements',
        'family devotional guides',
        'collaborative service projects',
        'story and testimony sharing across generations'
      ],
      abstractThinking: 'developing',
      specialConsiderations: [
        'Layer content for multiple comprehension levels',
        'Pair older and younger participants',
        'Include both active and reflective elements',
        'Use visuals that appeal across ages',
        'Foster mutual respect and learning between generations'
      ]
    }
  }
];

// ============================================================
// LOOKUP UTILITIES
// ============================================================

/**
 * Find an age group by ID
 */
export function getAgeGroupById(id: string): AgeGroup | undefined {
  return AGE_GROUPS.find(ag => ag.id === id);
}

/**
 * Find an age group by label (for backward compatibility)
 */
export function getAgeGroupByLabel(label: string): AgeGroup | undefined {
  return AGE_GROUPS.find(ag => ag.label === label);
}

/**
 * Get all age group labels for dropdown population
 */
export function getAgeGroupLabels(): string[] {
  return AGE_GROUPS.map(ag => ag.label);
}

/**
 * Get the default age group
 */
export function getDefaultAgeGroup(): AgeGroup {
  return AGE_GROUPS.find(ag => ag.id === 'youngadult')!;
}

/**
 * Get default age group label (for backward compatibility)
 */
export function getDefaultAgeGroupLabel(): string {
  return getDefaultAgeGroup().label;
}

// ============================================================
// VERSION
// ============================================================

export const AGE_GROUPS_VERSION = '1.0.0';

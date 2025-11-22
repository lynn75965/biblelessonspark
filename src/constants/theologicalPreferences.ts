/**
 * THEOLOGICAL PREFERENCES - Single Source of Truth (SSOT)
 */

import type { 
  TheologicalPreference, 
  TheologicalPreferenceKey,
  SBConfessionVersion,
  SBConfessionVersionKey
} from './contracts';

export const SB_CONFESSION_VERSIONS: Record<SBConfessionVersionKey, SBConfessionVersion> = {
  'bfm_1963': {
    id: 'bfm_1963',
    label: 'BF&M 1963',
    year: 1963,
    distinctives: [
      'Based on the Baptist Faith & Message (1963)',
      'Highlights "the criterion by which the Bible is to be interpreted is Jesus Christ"',
      'Emphasizes believer\'s baptism by immersion',
      'Affirms congregational governance & local-church autonomy',
      'Stresses evangelism & missions'
    ]
  },
  'bfm_2000': {
    id: 'bfm_2000',
    label: 'BF&M 2000',
    year: 2000,
    distinctives: [
      'Based on the Baptist Faith & Message (2000)',
      'Emphasizes the Bible\'s full authority & sufficiency',
      'Emphasizes believer\'s baptism by immersion',
      'Affirms congregational governance & local-church autonomy',
      'Stresses evangelism, missions, and perseverance of the believer'
    ]
  }
};

export const THEOLOGICAL_PREFERENCES: Record<TheologicalPreferenceKey, TheologicalPreference> = {
  'southern_baptist': {
    id: 'southern_baptist',
    name: 'Southern Baptist',
    short: 'SB',
    label: 'Southern Baptist Lens',
    description: 'Align with the Baptist Faith & Message. Emphasize believer\'s baptism by immersion, congregational polity, local church autonomy, evangelism/missions, assurance/perseverance. Avoid pedobaptism or non-congregational governance.',
    distinctives: [],
    hasVersions: true,
    versions: SB_CONFESSION_VERSIONS,
    defaultVersion: 'bfm_2000',
    contextDescription: 'Southern Baptist Convention theological perspective, emphasizing biblical inerrancy, salvation by grace through faith alone, believer\'s baptism by immersion, and the priesthood of all believers.'
  },
  'reformed_baptist': {
    id: 'reformed_baptist',
    name: 'Reformed Baptist',
    short: 'RB',
    label: 'Reformed Baptist Lens',
    description: 'Align with the 1689 London Baptist Confession. Emphasize doctrines of grace (TULIP), elder-led congregationalism, covenantal reading distinct from paedobaptism (still credobaptist). Avoid language that conflicts with credobaptism.',
    distinctives: [
      'Grounded in the 1689 London Baptist Confession',
      'Emphasizes doctrines of grace (TULIP)',
      'Holds to elder-led congregational polity',
      'Reads Scripture through a covenantal but credobaptist framework',
      'Values expository teaching and doctrinal depth'
    ],
    hasVersions: false,
    contextDescription: 'Reformed Baptist theological perspective, grounded in the 1689 London Baptist Confession, emphasizing the doctrines of grace (TULIP), covenant theology, elder-led congregationalism, and expository preaching.'
  },
  'independent_baptist': {
    id: 'independent_baptist',
    name: 'Independent Baptist',
    short: 'IB',
    label: 'Independent Baptist Lens',
    description: 'Emphasize independent local church governance, separation, strong personal evangelism, believer\'s baptism by immersion, congregational polity. Avoid implying denominational boards/structures.',
    distinctives: [
      'Stresses complete independence of the local church',
      'Upholds believer\'s baptism by immersion',
      'Strong focus on personal evangelism and soul-winning',
      'Prefers traditional worship and separation from denominational control',
      'Highlights practical holiness and daily obedience'
    ],
    hasVersions: false,
    contextDescription: 'Independent Baptist theological perspective, emphasizing complete local church autonomy, biblical authority, separation from worldly practices, personal evangelism, and conservative evangelical doctrine.'
  }
};

export function getTheologicalPreferenceKeys(): TheologicalPreferenceKey[] {
  return Object.keys(THEOLOGICAL_PREFERENCES) as TheologicalPreferenceKey[];
}

export function getTheologicalPreference(key: TheologicalPreferenceKey): TheologicalPreference {
  return THEOLOGICAL_PREFERENCES[key];
}

export function getDefaultTheologicalPreferenceKey(): TheologicalPreferenceKey {
  return 'southern_baptist';
}

export function getDefaultTheologicalPreference(): TheologicalPreference {
  return THEOLOGICAL_PREFERENCES[getDefaultTheologicalPreferenceKey()];
}

export function isValidTheologicalPreferenceKey(key: string): key is TheologicalPreferenceKey {
  return key in THEOLOGICAL_PREFERENCES;
}

export function getSBConfessionVersion(key: SBConfessionVersionKey): SBConfessionVersion {
  return SB_CONFESSION_VERSIONS[key];
}

export function getDefaultSBConfessionVersionKey(): SBConfessionVersionKey {
  return 'bfm_2000';
}

export function isValidSBConfessionVersionKey(key: string): key is SBConfessionVersionKey {
  return key in SB_CONFESSION_VERSIONS;
}

export function getDistinctives(preferenceKey: TheologicalPreferenceKey, versionKey?: SBConfessionVersionKey): string[] {
  const preference = THEOLOGICAL_PREFERENCES[preferenceKey];
  if (preferenceKey === 'southern_baptist' && preference.versions) {
    const version = versionKey || preference.defaultVersion || 'bfm_2000';
    return preference.versions[version]?.distinctives || [];
  }
  return preference.distinctives;
}

export function getTheologicalDisplayLabel(preferenceKey: TheologicalPreferenceKey, versionKey?: SBConfessionVersionKey): string {
  const preference = THEOLOGICAL_PREFERENCES[preferenceKey];
  if (preferenceKey === 'southern_baptist' && versionKey && preference.versions) {
    const version = preference.versions[versionKey];
    return preference.name + ' - ' + version.label;
  }
  return preference.name;
}

export function getTheologicalPreferenceOptions(): Array<{ value: TheologicalPreferenceKey; label: string }> {
  return getTheologicalPreferenceKeys().map(key => ({
    value: key,
    label: THEOLOGICAL_PREFERENCES[key].name
  }));
}

export function getSBConfessionVersionOptions(): Array<{ value: SBConfessionVersionKey; label: string }> {
  return (Object.keys(SB_CONFESSION_VERSIONS) as SBConfessionVersionKey[]).map(key => ({
    value: key,
    label: SB_CONFESSION_VERSIONS[key].label
  }));
}

export const THEOLOGICAL_PREFERENCES_VERSION = '1.0.0';

/**
 * Theology Profiles - Single Source of Truth (SSOT)
 */

export interface TheologyProfile {
  id: string;
  name: string;
  description: string;
  confessionVersion: '1963' | '2000';
  theologicalTradition: 'southern-baptist' | 'reformed-baptist' | 'independent-baptist';
  distinctives: string[];
}

export const THEOLOGY_PROFILES: TheologyProfile[] = [
  {
    id: 'southern-baptist-bfm-2000',
    name: 'Southern Baptist (BF&M 2000)',
    description: 'Baptist Faith & Message 2000',
    confessionVersion: '2000',
    theologicalTradition: 'southern-baptist',
    distinctives: ['Biblical inerrancy', 'Complementarian roles', 'Cooperative Program']
  },
  {
    id: 'southern-baptist-bfm-1963',
    name: 'Southern Baptist (BF&M 1963)',
    description: 'Baptist Faith & Message 1963',
    confessionVersion: '1963',
    theologicalTradition: 'southern-baptist',
    distinctives: ['Biblical authority', 'Soul liberty', 'Evangelical cooperation']
  },
  {
    id: 'reformed-baptist',
    name: 'Reformed Baptist',
    description: 'Reformed Baptist tradition',
    confessionVersion: '2000',
    theologicalTradition: 'reformed-baptist',
    distinctives: ['Five Points of Calvinism', 'Covenant theology', 'Doctrines of grace']
  },
  {
    id: 'independent-baptist',
    name: 'Independent Baptist',
    description: 'Independent Baptist tradition',
    confessionVersion: '2000',
    theologicalTradition: 'independent-baptist',
    distinctives: ['Church independence', 'Separation', 'Fundamentalist identity']
  }
];

export function getTheologyProfile(profileId: string): TheologyProfile | undefined {
  return THEOLOGY_PROFILES.find(profile => profile.id === profileId);
}

export default THEOLOGY_PROFILES;
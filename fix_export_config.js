const fs = require('fs');
const { execSync } = require('child_process');

const raw = execSync('git show HEAD:src/constants/seriesExportConfig.ts').toString();
const content = raw.replace(/\r\n/g, '\n');

const withImports = content.replace(
  "import { BRANDING } from '@/config/branding';",
  "import { BRANDING } from '@/config/branding';\nimport type { AudienceProfile } from '@/constants/audienceConfig';\nimport { resolveAudienceProfile } from '@/constants/audienceConfig';"
);

const withFunction = withImports + `
export function resolveExportTerminology(
  audienceProfile?: AudienceProfile
) {
  const profile = resolveAudienceProfile(audienceProfile);
  return {
    assemblyLabel:    profile.assembly,
    participantLabel: profile.participant,
  };
}
`;

fs.writeFileSync('src/constants/seriesExportConfig.ts', withFunction, { encoding: 'utf8' });
console.log('Done - lines: ' + withFunction.split('\n').length);

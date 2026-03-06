import subprocess

result = subprocess.run(['git', 'show', 'HEAD:src/constants/seriesExportConfig.ts'], capture_output=True)
content = result.stdout.decode('utf-8')

content = content.replace(
    "import { BRANDING } from '@/config/branding';",
    "import { BRANDING } from '@/config/branding';\nimport type { AudienceProfile } from '@/constants/audienceConfig';\nimport { resolveAudienceProfile } from '@/constants/audienceConfig';"
)

content += "\n\nexport function resolveExportTerminology(\n  audienceProfile?: AudienceProfile\n): { assemblyLabel: string; participantLabel: string } {\n  const profile = resolveAudienceProfile(audienceProfile);\n  return {\n    assemblyLabel:    profile.assembly,\n    participantLabel: profile.participant,\n  };\n}\n"

with open('src/constants/seriesExportConfig.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('Done')

const fs = require('fs');
const path = require('path');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}
function logSection(title) {
  log('\n' + '='.repeat(60), colors.blue);
  log(`  ${title}`, colors.bright + colors.blue);
  log('='.repeat(60), colors.blue);
}
function logSuccess(message) {
  log(`OK ${message}`, colors.green);
}
function logWarning(message) {
  log(`WARN ${message}`, colors.yellow);
}
function logError(message) {
  log(`ERR ${message}`, colors.red);
}
const FRONTEND_CONSTANTS_DIR = path.join(process.cwd(), 'src', 'constants');
const BACKEND_SHARED_DIR = path.join(process.cwd(), 'supabase', 'functions', '_shared');
const FILES_TO_SYNC = [
  'ageGroups.ts',
  'bibleVersions.ts',
  'generationMetrics.ts',
  'lessonStructure.ts',
  'lessonTiers.ts',
  'systemSettings.ts',
  'teacherPreferences.ts',
  'theologyProfiles.ts',
  'routes.ts',
  'contracts.ts',
  'rateLimitConfig.ts',
  'freshnessOptions.ts',
  'devotionalConfig.ts',
];
function generateHeader(sourceFile) {
  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/${sourceFile}
 * Generated: ${new Date().toISOString()}
 */
`;
}
function syncFile(fileName) {
  const frontendPath = path.join(FRONTEND_CONSTANTS_DIR, fileName);
  const backendPath = path.join(BACKEND_SHARED_DIR, fileName);
  if (!fs.existsSync(frontendPath)) {
    logWarning(`Frontend source not found: ${fileName} (skipping)`);
    return false;
  }
  try {
    const frontendContent = fs.readFileSync(frontendPath, 'utf8');
    const header = generateHeader(fileName);
    const backendContent = header + frontendContent;
    if (!fs.existsSync(BACKEND_SHARED_DIR)) {
      fs.mkdirSync(BACKEND_SHARED_DIR, { recursive: true });
    }
    fs.writeFileSync(backendPath, backendContent, 'utf8');
    logSuccess(`Synced: ${fileName}`);
    return true;
  } catch (error) {
    logError(`Failed to sync ${fileName}: ${error.message}`);
    return false;
  }
}
function main() {
  logSection('Build-Time Constants Synchronization');
  log('\nSource: src/constants/ (SSOT)');
  log('Target: supabase/functions/_shared/\n');
  let successCount = 0;
  for (const fileName of FILES_TO_SYNC) {
    const frontendPath = path.join(FRONTEND_CONSTANTS_DIR, fileName);
    if (fs.existsSync(frontendPath)) {
      if (syncFile(fileName)) successCount++;
    } else {
      log(`SKIP ${fileName} (not created yet)`, colors.yellow);
    }
  }
  logSection('Summary');
  log(`Synced: ${successCount} of ${FILES_TO_SYNC.length} files\n`);
}
main();






const fs = require('fs');

const filePath = 'C:/Users/Lynn/biblelessonspark/scripts/generate-css.cjs';

let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// ============================================================
// STEP 1: Add darkMode to the BRAND object mapping
// ============================================================
const oldBrand =
  '  // Typography\n' +
  '  fontPrimary: brandValues.typography.fontFamily.primary,';

const newBrand =
  '  // Dark mode surfaces\n' +
  '  darkMode: brandValues.darkMode,\n' +
  '\n' +
  '  // Typography\n' +
  '  fontPrimary: brandValues.typography.fontFamily.primary,';

if (!content.includes(oldBrand)) {
  console.error('ERROR: BRAND object anchor not found. Aborting.');
  process.exit(1);
}
content = content.replace(oldBrand, newBrand);
console.log('BRAND object: OK');

// ============================================================
// STEP 2: Replace the hardcoded .dark block with a
//         generator that reads from brand-values.json
// ============================================================
const oldDark =
  '  .dark {\n' +
  '    --background: 0 0% 10%;\n' +
  '    --foreground: 0 0% 95%;\n' +
  '    --card: 0 0% 12%;\n' +
  '    --card-foreground: 0 0% 95%;\n' +
  '    --popover: 0 0% 12%;\n' +
  '    --popover-foreground: 0 0% 95%;\n' +
  '    --primary: ${adjustLightness(primary, 10)};\n' +
  '    --primary-foreground: 0 0% 100%;\n' +
  '    --secondary: ${adjustLightness(secondary, 9)};\n' +
  '    --secondary-foreground: 0 0% 10%;\n' +
  '    --muted: 0 0% 20%;\n' +
  '    --muted-foreground: 0 0% 65%;\n' +
  '    --accent: ${adjustLightness(accent, 9)};\n' +
  '    --accent-foreground: 0 0% 10%;\n' +
  '    --destructive: ${adjustLightness(destructive, 10)};\n' +
  '    --destructive-foreground: 0 0% 100%;\n' +
  '    --border: 0 0% 20%;\n' +
  '    --input: 0 0% 20%;\n' +
  '    --ring: ${adjustLightness(primary, 10)};\n' +
  '  }';

const newDark =
  '  .dark {\n' +
  '    /* ===== Forest Green Dark Theme ===== */\n' +
  '    /* SSOT: surface values from brand-values.json darkMode section */\n' +
  '    --background: ${dm.surfaceHue} ${dm.background.saturation}% ${dm.background.lightness}%;\n' +
  '    --foreground: ${dm.surfaceHue} ${dm.foreground.saturation}% ${dm.foreground.lightness}%;\n' +
  '    --card: ${dm.surfaceHue} ${dm.card.saturation}% ${dm.card.lightness}%;\n' +
  '    --card-foreground: ${dm.surfaceHue} ${dm.foreground.saturation}% ${dm.foreground.lightness}%;\n' +
  '    --popover: ${dm.surfaceHue} ${dm.popover.saturation}% ${dm.popover.lightness}%;\n' +
  '    --popover-foreground: ${dm.surfaceHue} ${dm.foreground.saturation}% ${dm.foreground.lightness}%;\n' +
  '    --primary: ${adjustLightness(primary, 10)};\n' +
  '    --primary-foreground: 0 0% 100%;\n' +
  '    --secondary: ${adjustLightness(secondary, 9)};\n' +
  '    --secondary-foreground: 0 0% 10%;\n' +
  '    --muted: ${dm.surfaceHue} ${dm.muted.saturation}% ${dm.muted.lightness}%;\n' +
  '    --muted-foreground: ${dm.surfaceHue} ${dm.mutedForeground.saturation}% ${dm.mutedForeground.lightness}%;\n' +
  '    --accent: ${adjustLightness(accent, 9)};\n' +
  '    --accent-foreground: 0 0% 10%;\n' +
  '    --destructive: ${adjustLightness(destructive, 10)};\n' +
  '    --destructive-foreground: 0 0% 100%;\n' +
  '    --border: ${dm.surfaceHue} ${dm.border.saturation}% ${dm.border.lightness}%;\n' +
  '    --input: ${dm.surfaceHue} ${dm.input.saturation}% ${dm.input.lightness}%;\n' +
  '    --ring: ${adjustLightness(primary, 10)};\n' +
  '  }';

if (!content.includes(oldDark)) {
  console.error('ERROR: .dark block anchor not found. Aborting.');
  process.exit(1);
}
content = content.replace(oldDark, newDark);
console.log('.dark block: OK');

// ============================================================
// STEP 3: Add dm constant inside generateCSS() function,
//         just before the return statement
// ============================================================
const oldReturn =
  '  return `/**';

const newReturn =
  '  // Dark mode surface values from SSOT\n' +
  '  const dm = BRAND.darkMode;\n' +
  '\n' +
  '  return `/**';

if (!content.includes(oldReturn)) {
  console.error('ERROR: return statement anchor not found. Aborting.');
  process.exit(1);
}
content = content.replace(oldReturn, newReturn);
console.log('dm constant: OK');

// ============================================================
// Write file -- no BOM
// ============================================================
fs.writeFileSync(filePath, content, { encoding: 'utf8' });
console.log('generate-css.cjs written successfully.');
console.log('Line count: ' + content.split('\n').length);

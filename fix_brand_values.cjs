const fs = require('fs');

const filePath = 'C:/Users/Lynn/biblelessonspark/src/config/brand-values.json';

let raw = fs.readFileSync(filePath, 'utf8');
const brandValues = JSON.parse(raw);

// Safety check -- do not add twice
if (brandValues.darkMode) {
  console.error('ERROR: darkMode section already exists in brand-values.json. Aborting.');
  process.exit(1);
}

// Add darkMode section as SSOT for all .dark CSS variables.
// All surface colors derive from the primary Forest Green hue (120).
// Values are explicit HSL components -- hue / saturation% / lightness%.
// To make dark mode lighter, increase the lightness values here.
brandValues.darkMode = {
  "_comment": "Dark theme surface values. All use Forest Green hue (120). Edit here to adjust dark mode.",
  "surfaceHue": 120,
  "background":     { "saturation": 12, "lightness": 11 },
  "card":           { "saturation": 20, "lightness": 20 },
  "popover":        { "saturation": 20, "lightness": 15 },
  "muted":          { "saturation": 15, "lightness": 17 },
  "border":         { "saturation": 18, "lightness": 26 },
  "input":          { "saturation": 20, "lightness": 20 },
  "foreground":     { "saturation": 15, "lightness": 92 },
  "mutedForeground":{ "saturation": 15, "lightness": 71 }
};

// Write back with 2-space indent, no BOM
const output = JSON.stringify(brandValues, null, 2);
fs.writeFileSync(filePath, output, { encoding: 'utf8' });
console.log('brand-values.json updated with darkMode section.');
console.log('Line count: ' + output.split('\n').length);

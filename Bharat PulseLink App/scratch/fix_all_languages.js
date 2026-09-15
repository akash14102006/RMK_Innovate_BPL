const fs = require('fs');
const filePath = 'src/i18n/locales/allLanguages.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace any occurrence of appName: 'Bharat PulseLink' with appName + tagline
content = content.replace(
  /appName:\s*['"]Bharat PulseLink['"],?\s*(tagline:\s*['"].*?['"],?)?/g,
  `appName: 'Bharat PulseLink',\n      tagline: "India's Shared Memory for Every Patient, Every Hospital",`
);

// Fix any malformed syntax at the end of the file if present
const exportIdx = content.indexOf('export const languageResources');
if (exportIdx !== -1) {
  // Check brackets balance
  let openBraces = 0;
  let closeBraces = 0;
  for (let i = exportIdx; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') closeBraces++;
  }
  // Trim dangling characters if closeBraces > openBraces
  if (closeBraces > openBraces) {
    const lastClosing = content.lastIndexOf('};');
    if (lastClosing !== -1) {
      content = content.substring(0, lastClosing + 2) + '\n';
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed allLanguages.ts structure');

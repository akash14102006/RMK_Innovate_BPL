const fs = require('fs');
const filePath = 'src/i18n/locales/allLanguages.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix unescaped single quotes inside string values: '... ' ...'
// Ensure lines like "title: '...'," have proper escaping or conversion
const lines = content.split('\n');
const fixedLines = lines.map((line) => {
  // If line matches key: 'val',
  const match = line.match(/^(\s*[a-zA-Z0-9_"]+:\s*)'(.*)'(,?\s*)$/);
  if (match) {
    const prefix = match[1];
    let val = match[2];
    const suffix = match[3];
    // If val contains unescaped single quotes, escape them
    val = val.replace(/\\'/g, "'").replace(/'/g, "\\'");
    return `${prefix}'${val}'${suffix}`;
  }
  return line;
});

content = fixedLines.join('\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Sanitized allLanguages.ts quotes');

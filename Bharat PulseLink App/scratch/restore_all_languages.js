const fs = require('fs');
const transcriptPath = 'C:\\Users\\akash\\.gemini\\antigravity-ide\\brain\\2df3c8b3-3197-4702-aba4-ba3030475e8b\\.system_generated\\logs\\transcript_full.jsonl';
const targetPath = 'src/i18n/locales/allLanguages.ts';

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let codeContent = null;

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('export const languageResources')) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.tool_calls) {
        for (const tc of parsed.tool_calls) {
          if (tc.args && tc.args.CodeContent && tc.args.CodeContent.includes('export const languageResources')) {
            codeContent = tc.args.CodeContent;
            break;
          }
        }
      }
    } catch {
      // Continue searching
    }
  }
  if (codeContent) break;
}

if (codeContent) {
  fs.writeFileSync(targetPath, codeContent, 'utf8');
  console.log('Successfully restored original allLanguages.ts');
} else {
  console.error('Could not find allLanguages.ts codeContent in transcript');
}

const fs = require('fs');
let content = fs.readFileSync('src/pages/Logs.tsx', 'utf-8');

const regex = /const MOOD_EMOJIS: Record<string, string> = {[\s\S]*?};/m;
const correctEmojis = `const MOOD_EMOJIS: Record<string, string> = {
  'excellent': '??',
  'good': '??',
  'okay': '??',
  'not-great': '??',
  'bad': '??'
};`;

content = content.replace(regex, correctEmojis);
fs.writeFileSync('src/pages/Logs.tsx', content, 'utf-8');

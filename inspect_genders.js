const fs = require('fs');
const lines = fs.readFileSync('sheet_738903771.csv', 'utf8').split('\n');
let count = 0;
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (!parts[2] || isNaN(parseInt(parts[2]))) continue;
  const lineNo = parts[2].trim();
  const g = parts[11].trim();
  if (g) {
    console.log(`Line ${lineNo}: col11='${g}', type='${parts[14]}', notes='${parts[15]}'`);
    count++;
    if (count > 25) break;
  }
}

const fs = require('fs');
const lines = fs.readFileSync('sheet_738903771.csv', 'utf8').split('\n');

const samples = { blank: [], male: [], female: [], mixed: [] };

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (!parts[2] || isNaN(parseInt(parts[2]))) continue;
  const lineNo = parts[2].trim();
  const g = (parts[11] || '').trim();
  const type = (parts[14] || '').trim();
  const pattern = (parts[12] || '').trim();
  const note = (parts[15] || '').trim();
  const rem = (parts[31] || '').trim();

  const item = { lineNo, g, type, pattern, note, rem };

  if (!g) {
    if (samples.blank.length < 5) samples.blank.push(item);
  } else if (g.toUpperCase() === 'MALE') {
    if (samples.male.length < 5) samples.male.push(item);
  } else if (g.toUpperCase() === 'FEMALE') {
    if (samples.female.length < 5) samples.female.push(item);
  } else {
    if (samples.mixed.length < 10) samples.mixed.push(item);
  }
}

console.log('Sample Blank:', samples.blank);
console.log('Sample Male:', samples.male);
console.log('Sample Female:', samples.female);
console.log('Sample Mixed:', samples.mixed);

const fs = require('fs');
const lines = fs.readFileSync('sheet_738903771.csv', 'utf8').split('\n');

for (let l of [1, 2, 20, 50, 100, 127, 128, 133, 200, 300, 500, 700, 800, 900]) {
  const row = lines.find(r => r.split(',')[2] === l.toString());
  if (row) {
    const parts = row.split(',');
    console.log(`Line ${l}: col11='${parts[11]}', col12='${parts[12]}', col14='${parts[14]}', col31='${parts[31]}'`);
  }
}

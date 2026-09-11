// Median / p90 of each column in a steady-state CSV, plus RSS growth.
import fs from 'node:fs';
const csv = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n');
const header = csv[0].split(',');
const rows = csv.slice(1).map(l => l.split(',').map(Number));
const q = (a, p) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.max(0, Math.min(s.length - 1, Math.ceil(p * s.length) - 1))];
};
console.log(`samples=${rows.length} span=${rows[rows.length - 1][0]}s`);
for (let c = 1; c < header.length; c++) {
  const col = rows.map(r => r[c]);
  console.log(
    header[c].padEnd(12),
    'median',
    String(q(col, 0.5)).padStart(6),
    'p90',
    String(q(col, 0.9)).padStart(6),
    'min',
    String(Math.min(...col)).padStart(6),
    'max',
    String(Math.max(...col)).padStart(6),
  );
}
const rss = rows.map(r => r[header.indexOf('rss_mb')]).filter(Number.isFinite);
if (rss.length > 2) {
  const first = q(rss.slice(0, Math.max(1, Math.floor(rss.length / 5))), 0.5);
  const last = q(rss.slice(-Math.max(1, Math.floor(rss.length / 5))), 0.5);
  console.log(
    `rss first-fifth median ${first} MB -> last-fifth median ${last} MB (delta ${last - first} MB)`,
  );
}

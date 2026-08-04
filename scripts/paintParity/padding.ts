import fs from 'node:fs';
import path from 'node:path';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';
await LoadSkiaWeb();
const { Skia } = await import('./shim/skia');
import { outDir } from './config';
const rows = JSON.parse(
  fs.readFileSync(path.join(outDir(), 'skia.json'), 'utf8'),
);
const stats: { name: string; waste: number; unused: number }[] = [];
const clippedNames: string[] = [];
for (const r of rows) {
  if (!r.width || r.id === '__control__') continue;
  const file = path.join(outDir('skia'), `${r.id}.png`);
  if (!fs.existsSync(file)) continue;
  const img = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(file))),
  );
  const w = img.width(),
    h = img.height();
  const d = img.readPixels(0, 0, {
    width: w,
    height: h,
    colorType: 4,
    alphaType: 3,
  }) as Uint8Array;
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3]! > 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  const usedW = maxX - minX + 1,
    usedH = maxY - minY + 1;
  const clipped = minX === 0 || minY === 0 || maxX === w - 1 || maxY === h - 1;
  if (clipped)
    clippedNames.push(
      `${r.name} (${minX},${minY},${maxX}/${w - 1},${maxY}/${h - 1})`,
    );
  stats.push({
    name: r.name,
    waste: (w * h) / Math.max(usedW * usedH, 1),
    unused: ((w * h - usedW * usedH) * 4) / 1024,
  });
}
stats.sort((a, b) => b.waste - a.waste);
const mean = stats.reduce((t, s) => t + s.waste, 0) / stats.length;
console.log(
  `surface area / actually-painted area: mean=${mean.toFixed(2)}x  median=${stats[Math.floor(stats.length / 2)]!.waste.toFixed(2)}x`,
);
console.log(
  `paints whose painted pixels touch the surface edge (clipped): ${clippedNames.length}`,
);
for (const n of clippedNames.slice(0, 10)) console.log('   ', n);
console.log('most over-allocated:');
for (const s of stats.slice(0, 8))
  console.log(
    `  ${s.waste.toFixed(2)}x  ${s.unused.toFixed(0)}KB unused  ${s.name}`,
  );

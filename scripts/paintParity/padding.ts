/**
 * Reports how much of each baked surface the paint actually reaches into, and
 * flags any paint whose painted pixels touch the surface edge - a paint whose
 * shadow the bitmap is too small to hold. That count must stay at zero.
 */
import fs from 'node:fs';
import path from 'node:path';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';

await LoadSkiaWeb();

const { Skia } = await import('./shim/skia');
import { CONTROL_ID, outDir } from './config';

interface SkiaResult {
  id: string;
  name: string;
  width: number;
  height: number;
}

const skiaResults: SkiaResult[] = JSON.parse(
  fs.readFileSync(path.join(outDir(), 'skia.json'), 'utf8'),
);

const stats: { name: string; waste: number; unused: number }[] = [];
const clipped: string[] = [];

for (const result of skiaResults) {
  if (!result.width || result.id === CONTROL_ID) {
    continue;
  }
  const file = path.join(outDir('skia'), `${result.id}.png`);
  if (!fs.existsSync(file)) {
    continue;
  }

  const image = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(file))),
  );
  const width = image.width();
  const height = image.height();
  const pixels = image.readPixels(0, 0, {
    width,
    height,
    colorType: 4,
    alphaType: 3,
  }) as Uint8Array;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3]! > 2) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const paintedArea = (maxX - minX + 1) * (maxY - minY + 1);
  if (minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) {
    clipped.push(
      `${result.name} (${minX},${minY},${maxX}/${width - 1},${maxY}/${height - 1})`,
    );
  }
  stats.push({
    name: result.name,
    waste: (width * height) / Math.max(paintedArea, 1),
    unused: ((width * height - paintedArea) * 4) / 1024,
  });
}

stats.sort((a, b) => b.waste - a.waste);
const meanWaste =
  stats.reduce((total, stat) => total + stat.waste, 0) / stats.length;
const medianWaste = stats[Math.floor(stats.length / 2)]!.waste;

console.log(
  `surface area / actually-painted area: mean=${meanWaste.toFixed(2)}x  median=${medianWaste.toFixed(2)}x`,
);
console.log(
  `paints whose painted pixels touch the surface edge (clipped): ${clipped.length}`,
);
for (const name of clipped.slice(0, 10)) {
  console.log('   ', name);
}

console.log('most over-allocated:');
for (const stat of stats.slice(0, 8)) {
  console.log(
    `  ${stat.waste.toFixed(2)}x  ${stat.unused.toFixed(0)}KB unused  ${stat.name}`,
  );
}

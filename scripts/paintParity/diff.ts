/**
 * Scores the Skia renders against the Chrome (7TV website CSS) renders.
 *
 * Both sides are rendered on transparent, so the two things that can differ are
 * scored apart:
 *
 * - `coverage`: mean |alpha difference|. SkParagraph and Chrome rasterize type
 *   differently, so this never reaches zero; the `__control__` row (the same
 *   username with no paint at all) is the floor it is read against.
 * - `colour`: mean |RGB difference| over pixels both sides actually painted.
 *   This is the paint itself - gradient, texture, shadow colour - so a real
 *   paint bug shows up here well above the control.
 *
 * A small integer shift search absorbs sub-pixel baseline differences.
 */
import fs from 'node:fs';
import path from 'node:path';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';

await LoadSkiaWeb();

const { Skia } = await import('./shim/skia');
const { sevenTvPaintsFixture } =
  await import('@app/components/Chat/components/ChatMessage/__fixtures__/sevenTvPaints.fixture');

import { CONTROL_ID, outDir } from './config';

interface SkiaResult {
  id: string;
  name: string;
  width: number;
  height: number;
  skipped?: string;
}

const MAX_SHIFT = 2;
/**
 * Colour is only compared where both sides are close to fully covered. Below
 * that, un-premultiplying an 8-bit edge pixel amplifies rounding into tens of
 * levels of noise, which would swamp the paint difference being measured.
 */
const MIN_ALPHA = 224;

interface Pixels {
  width: number;
  height: number;
  data: Uint8Array;
}

function loadPixels(file: string): Pixels {
  const image = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(file))),
  );
  if (!image) {
    throw new Error(`decode failed: ${file}`);
  }
  const width = image.width();
  const height = image.height();
  const data = image.readPixels(0, 0, {
    width,
    height,
    colorType: 4, // RGBA_8888
    alphaType: 3, // Unpremul
  }) as Uint8Array;
  return { width, height, data };
}

interface Score {
  coverage: number;
  colour: number;
  colourP99: number;
  /**
   * Colour over pixels whose 3x3 neighbourhood is flat on both sides - glyph
   * interiors and gradient plateaus, away from the edges where the two text
   * rasterizers legitimately disagree. This is the purest "is it the same
   * paint" number the harness can produce.
   */
  colourFlat: number;
  flatShared: number;
  shared: number;
}

function compare(a: Pixels, b: Pixels, shiftX: number, shiftY: number): Score {
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  let coverageTotal = 0;
  let coverageCount = 0;
  let colourTotal = 0;
  let shared = 0;
  let flatTotal = 0;
  let flatCount = 0;
  const colourHistogram = new Uint32Array(256);

  const isFlat = (bitmap: Pixels, x: number, y: number, index: number) => {
    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        const n = ((y + oy) * bitmap.width + (x + ox)) * 4;
        for (let c = 0; c < 4; c += 1) {
          if (Math.abs(bitmap.data[n + c]! - bitmap.data[index + c]!) > 4) {
            return false;
          }
        }
      }
    }
    return true;
  };

  for (let y = MAX_SHIFT; y < height - MAX_SHIFT; y += 1) {
    for (let x = MAX_SHIFT; x < width - MAX_SHIFT; x += 1) {
      const ai = (y * a.width + x) * 4;
      const bi = ((y + shiftY) * b.width + (x + shiftX)) * 4;
      const alphaA = a.data[ai + 3]!;
      const alphaB = b.data[bi + 3]!;

      coverageTotal += Math.abs(alphaA - alphaB);
      coverageCount += 1;

      if (alphaA < MIN_ALPHA || alphaB < MIN_ALPHA) {
        continue;
      }
      const delta =
        (Math.abs(a.data[ai]! - b.data[bi]!) +
          Math.abs(a.data[ai + 1]! - b.data[bi + 1]!) +
          Math.abs(a.data[ai + 2]! - b.data[bi + 2]!)) /
        3;
      colourTotal += delta;
      colourHistogram[Math.min(255, Math.round(delta))]! += 1;
      shared += 1;

      if (isFlat(a, x, y, ai) && isFlat(b, x + shiftX, y + shiftY, bi)) {
        flatTotal += delta;
        flatCount += 1;
      }
    }
  }

  let colourP99 = 0;
  if (shared > 0) {
    let seen = 0;
    for (let bucket = 0; bucket < 256; bucket += 1) {
      seen += colourHistogram[bucket]!;
      if (seen >= shared * 0.99) {
        colourP99 = bucket;
        break;
      }
    }
  }

  return {
    coverage: coverageTotal / Math.max(coverageCount, 1),
    colour: colourTotal / Math.max(shared, 1),
    colourP99,
    colourFlat: flatTotal / Math.max(flatCount, 1),
    flatShared: flatCount,
    shared,
  };
}

const skiaResults: SkiaResult[] = JSON.parse(
  fs.readFileSync(path.join(outDir(), 'skia.json'), 'utf8'),
);
const sourceById = new Map(
  sevenTvPaintsFixture.map(paint => [paint.id, paint]),
);

interface Row extends Score {
  id: string;
  name: string;
  kinds: string;
  shift: string;
}

const rows: Row[] = [];

for (const result of skiaResults) {
  if (result.skipped) {
    continue;
  }
  const skiaFile = path.join(outDir('skia'), `${result.id}.png`);
  const refFile = path.join(outDir('ref'), `${result.id}.png`);
  if (!fs.existsSync(skiaFile) || !fs.existsSync(refFile)) {
    continue;
  }
  const skia = loadPixels(skiaFile);
  const ref = loadPixels(refFile);

  let best: Score | null = null;
  let bestShift = '0,0';
  for (let dy = -MAX_SHIFT; dy <= MAX_SHIFT; dy += 1) {
    for (let dx = -MAX_SHIFT; dx <= MAX_SHIFT; dx += 1) {
      const score = compare(ref, skia, dx, dy);
      if (!best || score.coverage < best.coverage) {
        best = score;
        bestShift = `${dx},${dy}`;
      }
    }
  }
  if (!best) {
    continue;
  }

  const source = sourceById.get(result.id);
  /**
   * An animated texture is at whatever frame each renderer happened to be on,
   * so its colour score says nothing about parity - keep those separate.
   */
  const animated = source?.data.layers.some(
    layer =>
      layer.ty.__typename === 'PaintLayerTypeImage' &&
      layer.ty.images.some(image => image.frameCount > 1),
  );
  const kinds =
    (source?.data.layers
      .map(layer => layer.ty.__typename.replace('PaintLayerType', ''))
      .join('+') || (result.id === CONTROL_ID ? 'control' : 'none')) +
    (animated ? ' (animated)' : '');

  rows.push({
    ...best,
    id: result.id,
    name: result.name,
    kinds,
    shift: bestShift,
  });
}

const control = rows.find(row => row.id === CONTROL_ID);
const painted = rows.filter(row => row.id !== CONTROL_ID);
painted.sort((a, b) => b.colour - a.colour);

fs.writeFileSync(
  path.join(outDir(), 'diff.json'),
  JSON.stringify({ control, painted }, null, 2),
);

/**
 * Stacked ref-over-skia strips for eyeballing the worst offenders.
 */
const stripCount = Number(process.env.STRIPS ?? 20);
if (stripCount > 0) {
  fs.mkdirSync(outDir('strips'), { recursive: true });
  for (const [index, row] of painted.slice(0, stripCount).entries()) {
    const decode = (dir: string) =>
      Skia.Image.MakeImageFromEncoded(
        Skia.Data.fromBytes(
          new Uint8Array(
            fs.readFileSync(path.join(outDir(dir), `${row.id}.png`)),
          ),
        ),
      );
    const ref = decode('ref');
    const skia = decode('skia');
    const width = Math.max(ref.width(), skia.width());
    const height = ref.height() + skia.height() + 6;
    const surface = Skia.Surface.Make(width, height);
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('#101010'));
    canvas.drawImage(ref, 0, 0);
    canvas.drawImage(skia, 0, ref.height() + 6);
    fs.writeFileSync(
      path.join(
        outDir('strips'),
        `${String(index).padStart(2, '0')}-${row.id}.png`,
      ),
      surface.makeImageSnapshot().encodeToBytes(),
    );
    surface.dispose();
  }
}

const line = (label: string, score: Score, count?: number) =>
  `${label.padEnd(26)}${count === undefined ? '' : `n=${String(count).padStart(4)}  `}` +
  `coverage=${score.coverage.toFixed(2).padStart(6)}  ` +
  `colour=${score.colour.toFixed(2).padStart(6)}  ` +
  `colourP99=${String(score.colourP99).padStart(3)}  ` +
  `colourFlat=${score.colourFlat.toFixed(2).padStart(6)} over ${String(Math.round(score.flatShared)).padStart(5)}px`;

console.log('\n=== glyph-rasterizer floor (same text, no paint) ===');
console.log(control ? line('control', control) : 'control missing');

const byKind = new Map<string, Row[]>();
for (const row of painted) {
  byKind.set(row.kinds, [...(byKind.get(row.kinds) ?? []), row]);
}
const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) /
  Math.max(values.length, 1);

console.log('\n=== painted, by layer kind ===');
for (const [kind, kindRows] of [...byKind].sort(
  (a, b) =>
    mean(b[1].map(row => row.colour)) - mean(a[1].map(row => row.colour)),
)) {
  console.log(
    line(
      kind,
      {
        coverage: mean(kindRows.map(row => row.coverage)),
        colour: mean(kindRows.map(row => row.colour)),
        colourP99: Math.round(mean(kindRows.map(row => row.colourP99))),
        colourFlat: mean(kindRows.map(row => row.colourFlat)),
        flatShared: mean(kindRows.map(row => row.flatShared)),
        shared: 0,
      },
      kindRows.length,
    ),
  );
}

console.log('\n=== worst 20 by colour ===');
for (const row of painted.slice(0, 20)) {
  console.log(
    `colour=${row.colour.toFixed(2).padStart(6)}  p99=${String(row.colourP99).padStart(3)}  ` +
      `coverage=${row.coverage.toFixed(2).padStart(6)}  shift=${row.shift.padEnd(6)} ` +
      `${row.kinds.padEnd(18)} ${row.name}`,
  );
}

const sortedColour = painted.map(row => row.colour).sort((a, b) => a - b);
const percentile = (fraction: number) =>
  sortedColour[
    Math.min(
      sortedColour.length - 1,
      Math.floor(sortedColour.length * fraction),
    )
  ]!;
const overFloor = control
  ? painted.filter(row => row.colour > control.colour * 2).length
  : 0;

console.log(
  `\nn=${painted.length}  colour p50=${percentile(0.5).toFixed(2)}  ` +
    `p90=${percentile(0.9).toFixed(2)}  p99=${percentile(0.99).toFixed(2)}  ` +
    `max=${percentile(1).toFixed(2)}`,
);
console.log(`paints with colour error over 2x the control floor: ${overFloor}`);

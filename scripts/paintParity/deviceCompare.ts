/**
 * Compares a painted username as the running app draws it - cropped out of a
 * device screenshot - against the Chrome reference for the same paint.
 *
 * The harness proves the rasterizer matches the web; this proves the app draws
 * what the rasterizer produced, closing the loop end to end.
 *
 *   bun --tsconfig-override ./scripts/paintParity/tsconfig.json \
 *     scripts/paintParity/deviceCompare.ts <screenshot> <paintId> <x> <y> <w> <h>
 *
 * The rect is the device-pixel region of the screenshot holding that one
 * painted name (generous is fine - both sides are trimmed to their content).
 */
import fs from 'node:fs';
import path from 'node:path';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';

await LoadSkiaWeb();

const { Skia } = await import('./shim/skia');
import { outDir } from './config';

interface Bitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

function decode(file: string): Bitmap {
  const image = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(file))),
  );
  if (!image) {
    throw new Error(`decode failed: ${file}`);
  }
  const width = image.width();
  const height = image.height();
  return {
    width,
    height,
    data: image.readPixels(0, 0, {
      width,
      height,
      colorType: 4,
      alphaType: 3,
    }) as Uint8Array,
  };
}

const [screenshotFile, paintId, xArg, yArg, wArg, hArg] = process.argv.slice(2);
const rect = {
  x: Number(xArg),
  y: Number(yArg),
  width: Number(wArg),
  height: Number(hArg),
};

const screenshot = decode(screenshotFile!);
const reference = decode(path.join(outDir('ref'), `${paintId}.png`));

/**
 * The screenshot is opaque over the app's background, so the reference is
 * composited onto the same colour before comparing. The corner of the crop is
 * background by construction.
 */
const cornerIndex = (rect.y * screenshot.width + rect.x) * 4;
const background = [
  screenshot.data[cornerIndex]!,
  screenshot.data[cornerIndex + 1]!,
  screenshot.data[cornerIndex + 2]!,
];

function flattenReference(): Bitmap {
  const data = new Uint8Array(reference.width * reference.height * 4);
  for (let i = 0; i < reference.width * reference.height; i += 1) {
    const alpha = reference.data[i * 4 + 3]! / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      data[i * 4 + channel] = Math.round(
        reference.data[i * 4 + channel]! * alpha +
          background[channel]! * (1 - alpha),
      );
    }
    data[i * 4 + 3] = 255;
  }
  return { width: reference.width, height: reference.height, data };
}

/**
 * Content bounds - anything that differs from the background - so the two can
 * be aligned without knowing exactly where the row sits on screen.
 */
function contentBounds(
  bitmap: Bitmap,
  region: { x: number; y: number; width: number; height: number },
) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = region.y; y < region.y + region.height; y += 1) {
    for (let x = region.x; x < region.x + region.width; x += 1) {
      const index = (y * bitmap.width + x) * 4;
      const delta =
        Math.abs(bitmap.data[index]! - background[0]!) +
        Math.abs(bitmap.data[index + 1]! - background[1]!) +
        Math.abs(bitmap.data[index + 2]! - background[2]!);
      if (delta > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

const flat = flattenReference();
const deviceBounds = contentBounds(screenshot, rect);
const refBounds = contentBounds(flat, {
  x: 0,
  y: 0,
  width: flat.width,
  height: flat.height,
});

const compareWidth = Math.min(
  deviceBounds.maxX - deviceBounds.minX,
  refBounds.maxX - refBounds.minX,
);
const compareHeight = Math.min(
  deviceBounds.maxY - deviceBounds.minY,
  refBounds.maxY - refBounds.minY,
);

let best = { mae: Infinity, dx: 0, dy: 0 };
for (let dy = -4; dy <= 4; dy += 1) {
  for (let dx = -4; dx <= 4; dx += 1) {
    let total = 0;
    let count = 0;
    for (let y = 0; y < compareHeight; y += 1) {
      for (let x = 0; x < compareWidth; x += 1) {
        const di =
          ((deviceBounds.minY + y + dy) * screenshot.width +
            (deviceBounds.minX + x + dx)) *
          4;
        const ri =
          ((refBounds.minY + y) * flat.width + (refBounds.minX + x)) * 4;
        total +=
          (Math.abs(screenshot.data[di]! - flat.data[ri]!) +
            Math.abs(screenshot.data[di + 1]! - flat.data[ri + 1]!) +
            Math.abs(screenshot.data[di + 2]! - flat.data[ri + 2]!)) /
          3;
        count += 1;
      }
    }
    const mae = total / Math.max(count, 1);
    if (mae < best.mae) {
      best = { mae, dx, dy };
    }
  }
}

console.log(
  `device box ${deviceBounds.maxX - deviceBounds.minX}x${deviceBounds.maxY - deviceBounds.minY}, ` +
    `chrome box ${refBounds.maxX - refBounds.minX}x${refBounds.maxY - refBounds.minY}`,
);
console.log(
  `best alignment ${best.dx},${best.dy}  mae=${best.mae.toFixed(2)} (0-255)`,
);

// Stacked chrome-over-device strip for eyeballing.
const surface = Skia.Surface.Make(compareWidth, compareHeight * 2 + 4);
const canvas = surface.getCanvas();
canvas.clear(Skia.Color('#101010'));
const draw = (bitmap: Bitmap, sx: number, sy: number, dy: number) => {
  const image = Skia.Image.MakeImage(
    {
      width: bitmap.width,
      height: bitmap.height,
      colorType: 4,
      alphaType: 3,
    },
    Skia.Data.fromBytes(bitmap.data),
    bitmap.width * 4,
  );
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(sx, sy, compareWidth, compareHeight),
    Skia.XYWHRect(0, dy, compareWidth, compareHeight),
    Skia.Paint(),
  );
};
draw(flat, refBounds.minX, refBounds.minY, 0);
draw(
  screenshot,
  deviceBounds.minX + best.dx,
  deviceBounds.minY + best.dy,
  compareHeight + 4,
);
fs.writeFileSync(
  path.join(outDir(), `device-${paintId}.png`),
  surface.makeImageSnapshot().encodeToBytes(),
);
console.log(`wrote ${path.join(outDir(), `device-${paintId}.png`)}`);

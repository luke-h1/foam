/**
 * Renders painted usernames through the real app rasterizer
 * (skiaPaintedUsernameRasterizer) under headless CanvasKit, so the output can
 * be pixel-diffed against Chrome rendering the 7TV website's paint CSS.
 */
import fs from 'node:fs';
import path from 'node:path';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';

// The bitmap cache defers texture disposal through rAF, which node lacks.
(globalThis as any).requestAnimationFrame ??= (cb: () => void) =>
  setTimeout(cb, 0);

await LoadSkiaWeb();

const { Skia, BlendMode } = await import('./shim/skia');
const { getPaintBitmaps } =
  await import('@app/components/Chat/components/ChatMessage/CosmeticUsername/util/skiaPaintedUsernameRasterizer');
const { convertV4PaintToPaintData } =
  await import('@app/utils/color/sevenTvPaintData/convertV4PaintToPaintData');
const { sevenTvPaintsFixture } =
  await import('@app/components/Chat/components/ChatMessage/__fixtures__/sevenTvPaints.fixture');

import { CONTROL_ID, HARNESS, outDir, selectPaints } from './config';

const fontDir = path.resolve(
  import.meta.dir,
  '../../node_modules/@expo-google-fonts/montserrat',
);
const faces = [
  '400Regular/Montserrat_400Regular.ttf',
  '500Medium/Montserrat_500Medium.ttf',
  '600SemiBold/Montserrat_600SemiBold.ttf',
  '700Bold/Montserrat_700Bold.ttf',
  '800ExtraBold/Montserrat_800ExtraBold.ttf',
  '900Black/Montserrat_900Black.ttf',
];

const fontProvider = Skia.TypefaceFontProvider.Make();
for (const face of faces) {
  const bytes = new Uint8Array(fs.readFileSync(path.join(fontDir, face)));
  const data = Skia.Data.fromBytes(bytes);
  const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);
  if (!typeface) {
    throw new Error(`failed to load ${face}`);
  }
  fontProvider.registerFont(typeface, 'Montserrat');
}

const textureCache = new Map<string, any>();
async function loadTexture(url: string) {
  if (textureCache.has(url)) {
    return textureCache.get(url);
  }
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`texture ${url} -> ${response.status}`);
    textureCache.set(url, null);
    return null;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const data = Skia.Data.fromBytes(bytes);
  const image = Skia.Image.MakeImageFromEncoded(data);
  textureCache.set(url, image ?? null);
  return image ?? null;
}

fs.mkdirSync(outDir('skia'), { recursive: true });

const results: {
  id: string;
  name: string;
  width: number;
  height: number;
  insets: { left: number; top: number; right: number; bottom: number };
  file: string;
  skipped?: string;
}[] = [];

const controlSource = {
  id: CONTROL_ID,
  name: 'control (no paint)',
  data: { layers: [], shadows: [] },
} as unknown as (typeof sevenTvPaintsFixture)[number];

for (const source of [controlSource, ...selectPaints(sevenTvPaintsFixture)]) {
  const paint = convertV4PaintToPaintData(source);
  const bitmaps = getPaintBitmaps({
    displayUsername: HARNESS.username,
    paint,
    fallbackColor: HARNESS.fallbackColor,
    fontSize: HARNESS.fontSize,
    pixelRatio: HARNESS.pixelRatio,
    fontProvider,
    fontFamily: 'Montserrat',
  });

  if (!bitmaps) {
    results.push({
      id: source.id,
      name: source.name,
      width: 0,
      height: 0,
      insets: { left: 0, top: 0, right: 0, bottom: 0 },
      file: '',
      skipped: 'no bitmaps',
    });
    continue;
  }

  const scale = HARNESS.pixelRatio;
  const widthPx = Math.round(bitmaps.width * scale);
  const heightPx = Math.round(bitmaps.height * scale);
  const surface = Skia.Surface.Make(widthPx, heightPx);
  const canvas = surface.getCanvas();
  // Transparent so the diff can score coverage and colour separately.
  canvas.clear(Skia.Color('#00000000'));
  canvas.save();
  canvas.scale(scale, scale);

  const drawFull = (image: any) => {
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, bitmaps.width, bitmaps.height),
      Skia.Paint(),
    );
  };

  drawFull(bitmaps.staticImage);

  for (const [index, slot] of bitmaps.layerSlots.entries()) {
    if (slot.kind === 'baked') {
      drawFull(slot.image);
      continue;
    }
    const layer = slot.layer;
    const texture = await loadTexture(layer.url);
    if (!texture || !bitmaps.maskImage) {
      continue;
    }
    const spanPaint = Skia.Paint();
    if (layer.opacity < 1) {
      spanPaint.setAlphaf(layer.opacity);
    }
    canvas.saveLayer(spanPaint);
    if (index > 0 || layer.opacity < 1) {
      if (bitmaps.backingImage) {
        drawFull(bitmaps.backingImage);
      }
    }
    canvas.saveLayer(Skia.Paint());
    if (layer.rect) {
      canvas.drawImageRect(
        texture,
        Skia.XYWHRect(0, 0, texture.width(), texture.height()),
        Skia.XYWHRect(
          layer.rect.x,
          layer.rect.y,
          layer.rect.width,
          layer.rect.height,
        ),
        Skia.Paint(),
      );
    }
    const maskPaint = Skia.Paint();
    maskPaint.setBlendMode(BlendMode.DstIn);
    canvas.drawImageRect(
      bitmaps.maskImage,
      Skia.XYWHRect(
        0,
        0,
        bitmaps.maskImage.width(),
        bitmaps.maskImage.height(),
      ),
      Skia.XYWHRect(0, 0, bitmaps.width, bitmaps.height),
      maskPaint,
    );
    canvas.restore();
    canvas.restore();
  }

  if (bitmaps.strokeImage) {
    drawFull(bitmaps.strokeImage);
  }

  canvas.restore();
  const snapshot = surface.makeImageSnapshot();
  const png = snapshot.encodeToBytes();
  const file = path.join(outDir('skia'), `${source.id}.png`);
  fs.writeFileSync(file, png);
  surface.dispose();

  results.push({
    id: source.id,
    name: source.name,
    width: bitmaps.width,
    height: bitmaps.height,
    insets: bitmaps.insets,
    file,
  });
}

fs.writeFileSync(
  path.join(outDir(), 'skia.json'),
  JSON.stringify(results, null, 2),
);
console.log(`rendered ${results.length} paints -> ${outDir('skia')}`);

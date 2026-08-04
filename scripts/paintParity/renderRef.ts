/**
 * Renders the same paints through Chrome using the 7TV website's markup and
 * CSS, at the same device scale as the Skia harness, and crops one PNG per
 * paint aligned to the Skia bitmap box. Runs in batches - one screenshot per
 * batch - because a single sheet for ~1000 paints exhausts the wasm heap on
 * decode.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web';

await LoadSkiaWeb();

const { Skia } = await import('./shim/skia');
const { sevenTvPaintsFixture } =
  await import('@app/components/Chat/components/ChatMessage/__fixtures__/sevenTvPaints.fixture');

import { CONTROL_ID, HARNESS, outDir } from './config';
import { websiteLayerStyles } from './websitePaintCss';

interface SkiaResult {
  id: string;
  name: string;
  width: number;
  height: number;
  insets: { left: number; top: number; right: number; bottom: number };
  file: string;
  skipped?: string;
}

const skiaResults: SkiaResult[] = JSON.parse(
  fs.readFileSync(path.join(outDir(), 'skia.json'), 'utf8'),
).filter((result: SkiaResult) => !result.skipped);
const byId = new Map(sevenTvPaintsFixture.map(paint => [paint.id, paint]));

const fontPath = path.resolve(
  import.meta.dir,
  '../../node_modules/@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf',
);
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

/**
 * Chrome writes the screenshot but often keeps the process alive afterwards,
 * so poll for the file instead of waiting on exit.
 */
function runChrome(shotFile: string, args: string[]): void {
  const child = Bun.spawn(
    ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ...args],
    { stdout: 'ignore', stderr: 'ignore' },
  );
  const deadline = Date.now() + 120_000;
  let lastSize = -1;
  while (Date.now() < deadline) {
    execFileSync('/bin/sleep', ['0.5']);
    if (!fs.existsSync(shotFile)) {
      continue;
    }
    const size = fs.statSync(shotFile).size;
    if (size > 0 && size === lastSize) {
      break;
    }
    lastSize = size;
  }
  child.kill();
}

const CELL_GAP = 8;
const COLUMNS = 8;
const BATCH_SIZE = 80;
const columnWidth =
  Math.ceil(Math.max(...skiaResults.map(result => result.width))) + CELL_GAP;

fs.mkdirSync(outDir('ref'), { recursive: true });
const chromeProfile = path.join(outDir(), 'chrome-profile');
const scale = HARNESS.pixelRatio;

function renderBatch(batch: SkiaResult[], batchIndex: number): void {
  const cells: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  const columnCursorY = new Array<number>(COLUMNS).fill(CELL_GAP);
  const cellHtml: string[] = [];
  let column = 0;

  for (const result of batch) {
    const paint = byId.get(result.id);
    if (!paint && result.id !== CONTROL_ID) {
      continue;
    }
    const layers = paint ? websiteLayerStyles(paint) : [];
    const spans = layers
      .map(layer => {
        const style = [
          `opacity:${layer.opacity}`,
          layer.backgroundImage
            ? `background-image:${layer.backgroundImage}`
            : '',
          layer.backgroundColor
            ? `background-color:${layer.backgroundColor}`
            : '',
          layer.filter ? `filter:${layer.filter}` : '',
        ]
          .filter(Boolean)
          .join(';');
        return `<span class="layer bg-clip" style="${style}">${HARNESS.username}</span>`;
      })
      .join('');
    const body = spans || `<span class="layer">${HARNESS.username}</span>`;

    const cellWidth = Math.ceil(result.width);
    const cellHeight = Math.ceil(result.height);
    const x = CELL_GAP + column * columnWidth;
    const y = columnCursorY[column]!;
    cells.push({ id: result.id, x, y, width: cellWidth, height: cellHeight });
    cellHtml.push(
      `<div class="cell" style="left:${x}px;top:${y}px;width:${cellWidth}px;height:${cellHeight}px">` +
        `<div class="paint" style="left:${result.insets.left}px;top:${result.insets.top}px">${body}</div>` +
        `</div>`,
    );
    columnCursorY[column] = y + cellHeight + CELL_GAP;
    column = (column + 1) % COLUMNS;
  }

  const sheetWidth = CELL_GAP * 2 + COLUMNS * columnWidth;
  const sheetHeight = Math.max(...columnCursorY) + CELL_GAP;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {
  font-family: 'Montserrat';
  src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
  font-weight: 400;
  font-style: normal;
}
html, body { margin: 0; padding: 0; background: transparent; }
body {
  font-family: 'Montserrat';
  font-size: ${HARNESS.fontSize}px;
  font-weight: 400;
  line-height: normal;
  color: ${HARNESS.fallbackColor};
  position: relative;
  width: ${sheetWidth}px;
  height: ${sheetHeight}px;
}
.cell { position: absolute; overflow: hidden; }
.paint { position: absolute; display: grid; justify-items: start; }
.layer { grid-area: 1 / 1 / -1 / -1; }
.layer.bg-clip {
  background-color: currentColor;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  background-size: 100% 100%;
}
</style></head><body>${cellHtml.join('')}</body></html>`;

  const htmlFile = path.join(outDir(), `ref-${batchIndex}.html`);
  fs.writeFileSync(htmlFile, html);
  const shotFile = path.join(outDir(), `ref-${batchIndex}.png`);
  fs.rmSync(shotFile, { force: true });

  runChrome(shotFile, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-component-update',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    `--force-device-scale-factor=${scale}`,
    `--window-size=${sheetWidth},${sheetHeight}`,
    '--virtual-time-budget=15000',
    `--screenshot=${shotFile}`,
    `--user-data-dir=${chromeProfile}`,
    `file://${htmlFile}`,
  ]);

  const sheet = Skia.Image.MakeImageFromEncoded(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(shotFile))),
  );
  if (!sheet) {
    throw new Error(`failed to decode chrome screenshot ${batchIndex}`);
  }

  for (const cell of cells) {
    const widthPx = Math.round(cell.width * scale);
    const heightPx = Math.round(cell.height * scale);
    const surface = Skia.Surface.Make(widthPx, heightPx);
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color('#00000000'));
    canvas.drawImageRect(
      sheet,
      Skia.XYWHRect(
        Math.round(cell.x * scale),
        Math.round(cell.y * scale),
        widthPx,
        heightPx,
      ),
      Skia.XYWHRect(0, 0, widthPx, heightPx),
      Skia.Paint(),
    );
    const snapshot = surface.makeImageSnapshot();
    fs.writeFileSync(
      path.join(outDir('ref'), `${cell.id}.png`),
      snapshot.encodeToBytes(),
    );
    snapshot.dispose();
    surface.dispose();
  }
  sheet.dispose();
  fs.rmSync(shotFile, { force: true });
  fs.rmSync(htmlFile, { force: true });
  console.log(`batch ${batchIndex}: ${cells.length} cells`);
}

for (let i = 0; i < skiaResults.length; i += BATCH_SIZE) {
  renderBatch(skiaResults.slice(i, i + BATCH_SIZE), i / BATCH_SIZE);
}

console.log(`done: ${fs.readdirSync(outDir('ref')).length} refs`);

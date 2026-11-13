import { View } from 'react-native';

import type { SkImage } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import { act } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { sevenTvPaintsFixture } from '@app/components/chat/components/chat-message/__fixtures__/seven-tv-paints.fixture';
import { paintRendererFlag$ } from '@app/store/preference-store';
import { convertV4PaintToPaintData } from '@app/utils/seven-tv/gql/convertV4PaintToPaintData';

import { PaintedUsername } from '../PaintedUsername';
import { SharedPaintAnimationDrivers } from '../util/sharedPaintAnimationFrames';

/**
 * The jest Skia mock cannot load fonts or rasterise, so these stubs let the
 * Skia renderer mount its canvas as it does on a device.
 */
jest.mock('../util/skiaPaintFonts', () => ({
  useSkiaPaintFontProvider: () => ({}),
}));

jest.mock('../util/paintCanvasRedraw', () => ({
  schedulePaintCanvasRedraw: () => {},
  cancelPaintCanvasRedraw: () => {},
}));

jest.mock('../util/skiaPaintedUsernameRasterizer', () => ({
  ...jest.requireActual<typeof import('../util/skiaPaintedUsernameRasterizer')>(
    '../util/skiaPaintedUsernameRasterizer',
  ),
  getPaintBitmaps: ({ displayUsername }: { displayUsername: string }) => {
    const url = `https://cdn.7tv.app/paint/${displayUsername.length % 4}/4x.webp`;
    const layer = {
      url,
      rect: { x: 0, y: 0, width: 60, height: 18 },
      tile: null,
      opacity: 1,
    };

    return {
      staticImage: {},
      maskImage: {},
      layerSlots: [{ kind: 'url', layer }],
      strokeImage: null,
      imageLayers: [layer],
      width: 60,
      height: 18,
      insets: { left: 0, top: 0, right: 0, bottom: 0 },
    };
  },
}));

jest.mock('@app/utils/image/paintBitmapCacheLifecycle', () => ({
  ...jest.requireActual<
    typeof import('@app/utils/image/paintBitmapCacheLifecycle')
  >('@app/utils/image/paintBitmapCacheLifecycle'),
  retainPaintBitmaps: () => true,
  releasePaintBitmaps: () => {},
}));

const MEASURE_OPTIONS = {
  runs: 10,
  warmupRuns: 2,
} as const;

const ROW_COUNT = 8;
const TICK_COUNT = 30;
const FRAME_INTERVAL_MS = 100;

const paint = convertV4PaintToPaintData(sevenTvPaintsFixture[0]!);

let clockMs = 1_000_000;
let rafQueue: FrameRequestCallback[] = [];

function makeFrame(): SkImage {
  // SAFETY: the canvas only forwards the frame to Skia image props, and the frame clock only calls dispose on it.
  return { dispose: () => {} } as never;
}

function makeAnimation() {
  let frame = makeFrame();

  return {
    getFrameCount: () => 2,
    currentFrameDuration: () => FRAME_INTERVAL_MS,
    decodeNextFrame: () => {
      frame = makeFrame();
      return 0;
    },
    getCurrentFrame: () => frame,
    dispose: () => {},
  };
}

function flushAnimationFrames() {
  const queued = rafQueue;

  rafQueue = [];

  for (const callback of queued) {
    callback(clockMs);
  }
}

beforeAll(() => {
  // Fake timers hold the clock's 5s texture linger timers, so none outlives the file.
  jest.useFakeTimers();
  jest.spyOn(Date, 'now').mockImplementation(() => clockMs);

  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
    rafQueue.push(cb);
    return rafQueue.length;
  });

  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {
    rafQueue = [];
  });

  // SAFETY: the frame clock only hands this to MakeAnimatedImageFromEncoded and dispose.
  jest
    .spyOn(Skia.Data, 'fromURI')
    .mockResolvedValue({ dispose: () => {} } as never);

  // SAFETY: the frame clock uses only these members of SkAnimatedImage.
  jest
    .spyOn(Skia.AnimatedImage, 'MakeAnimatedImageFromEncoded')
    .mockImplementation(() => makeAnimation() as never);
});

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function AnimatedPaintRows() {
  return (
    <View>
      <SharedPaintAnimationDrivers />
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <PaintedUsername
          key={index}
          fallbackColor='#9147FF'
          isModerated={false}
          paint={paint}
          username={`chatter${'x'.repeat(index)}`}
        />
      ))}
    </View>
  );
}

async function advanceClock() {
  for (let tick = 0; tick < TICK_COUNT; tick += 1) {
    await act(async () => {
      clockMs += FRAME_INTERVAL_MS;
      flushAnimationFrames();
    });
  }
}

describe('PaintedUsername animated paint performance', () => {
  test('advances the shared paint clock under a screen of animated Skia paints', async () => {
    paintRendererFlag$.set('skia');

    await measureRenders(<AnimatedPaintRows />, {
      ...MEASURE_OPTIONS,
      scenario: advanceClock,
    });
  });
});

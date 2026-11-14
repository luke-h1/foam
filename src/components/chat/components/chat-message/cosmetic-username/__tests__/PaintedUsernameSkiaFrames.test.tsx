import { Component, Profiler, type ReactNode } from 'react';
import { View } from 'react-native';

import type { SkData } from '@shopify/react-native-skia';
import * as skia from '@shopify/react-native-skia';
import { act, cleanup, render } from '@testing-library/react-native';

import { sevenTvPaintsFixture } from '@app/components/chat/components/chat-message/__fixtures__/seven-tv-paints.fixture';
import { chatScrollActivity } from '@app/components/chat/util/chatScrollActivity';
import { convertV4PaintToPaintData } from '@app/utils/seven-tv/gql/convertV4PaintToPaintData';

import { PaintedUsernameSkia } from '../PaintedUsernameSkia';
import { SharedPaintAnimationDrivers } from '../util/sharedPaintAnimationFrames';

jest.mock('../util/skiaPaintFonts', () => ({
  useSkiaPaintFontProvider: () => ({}),
}));

jest.mock('../util/skiaPaintedUsernameRasterizer', () => ({
  ...jest.requireActual<typeof import('../util/skiaPaintedUsernameRasterizer')>(
    '../util/skiaPaintedUsernameRasterizer',
  ),
  getPaintBitmaps: ({ displayUsername }: { displayUsername: string }) => {
    const layers =
      displayUsername === 'static'
        ? []
        : [
            {
              url: `https://cdn.7tv.app/paint/${displayUsername}/4x.webp`,
              rect: { x: 0, y: 0, width: 60, height: 18 },
              tile: null,
              opacity: 1,
            },
          ];

    return {
      staticImage: { name: 'static', width: () => 180, height: () => 54 },
      maskImage: { name: 'mask', width: () => 180, height: () => 54 },
      layerSlots: layers.map(layer => ({ kind: 'url', layer })),
      strokeImage: null,
      imageLayers: layers,
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

interface FakeFrame {
  name: string;
  width: () => number;
  height: () => number;
  dispose: () => void;
}

interface FakePicture {
  nativeId: number;
  images: string[];
}

const FRAME_INTERVAL_MS = 100;
const paint = convertV4PaintToPaintData(sevenTvPaintsFixture[0]!);

let clockMs = 1_000_000;
let rafQueue: FrameRequestCallback[] = [];
let nextNativeId = 1;
let pictures: FakePicture[] = [];
const decodeCounts = new Map<string, number>();

function makeFrame(name: string): FakeFrame {
  return { name, width: () => 8, height: () => 8, dispose: () => {} };
}

function makeAnimation(url: string) {
  const key = url.split('/')[4]!;
  let frame = makeFrame(`${key}#0`);

  return {
    getFrameCount: () => 2,
    currentFrameDuration: () => FRAME_INTERVAL_MS,
    decodeNextFrame: () => {
      const count = (decodeCounts.get(key) ?? 0) + 1;

      decodeCounts.set(key, count);
      frame = makeFrame(`${key}#${count}`);
      return 0;
    },
    getCurrentFrame: () => frame,
    dispose: () => {},
  };
}

class FakePictureView extends Component<{ style?: object }> {
  readonly nativeId = nextNativeId++;
  readonly redraw = jest.fn();

  override render() {
    return <View style={this.props.style} />;
  }
}

class FakeCanvas extends Component<{ children?: ReactNode }> {
  readonly redraw = jest.fn();

  override render() {
    return <View>{this.props.children}</View>;
  }
}

function makeRecorder() {
  const images: string[] = [];

  const canvas = {
    drawImageRectOptions: (image: { name: string }) => images.push(image.name),
    saveLayer: () => 0,
    restore: () => {},
    drawPaint: () => {},
  };

  return {
    beginRecording: () => canvas,
    finishRecordingAsPicture: () => ({ images, dispose: () => {} }),
    dispose: () => {},
  };
}

function makePaint() {
  return {
    setBlendMode: () => {},
    setAlphaf: () => {},
    setShader: () => {},
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

async function tick() {
  await act(async () => {
    clockMs += FRAME_INTERVAL_MS;
    flushAnimationFrames();
  });

  await act(async () => {
    flushAnimationFrames();
  });
}

function picturesFor(nativeId: number): string[][] {
  return pictures
    .filter(picture => picture.nativeId === nativeId)
    .map(picture => picture.images);
}

const skiaModule: { SkiaPictureView: unknown; Canvas: unknown } =
  jest.requireMock('@shopify/react-native-skia');

const originalPictureView = skiaModule.SkiaPictureView;
const originalCanvas = skiaModule.Canvas;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Date, 'now').mockImplementation(() => clockMs);

  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
    rafQueue.push(cb);
    return rafQueue.length;
  });

  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

  const fetchedUrls = new WeakMap<SkData, string>();

  jest.spyOn(skia.Skia.Data, 'fromURI').mockImplementation(url => {
    // SAFETY: the frame clock only hands this to MakeAnimatedImageFromEncoded and dispose.
    const data: SkData = { dispose: () => {} } as never;

    fetchedUrls.set(data, url);
    return Promise.resolve(data);
  });

  // SAFETY: the frame clock uses only these members of SkAnimatedImage.
  jest
    .spyOn(skia.Skia.AnimatedImage, 'MakeAnimatedImageFromEncoded')
    .mockImplementation(
      data => makeAnimation(fetchedUrls.get(data) ?? '') as never,
    );

  // SAFETY: the picture recorder only calls the members makeRecorder provides.
  jest
    .spyOn(skia.Skia, 'PictureRecorder')
    .mockImplementation(() => makeRecorder() as never);

  // SAFETY: the picture recorder only calls the members makePaint provides.
  jest.spyOn(skia.Skia, 'Paint').mockImplementation(() => makePaint() as never);

  pictures = [];
  decodeCounts.clear();
  skiaModule.SkiaPictureView = FakePictureView;
  skiaModule.Canvas = FakeCanvas;

  // SAFETY: the test stands in for the native view API, and the picture view uses only setJsiProperty.
  (globalThis as { SkiaViewApi?: unknown }).SkiaViewApi = {
    setJsiProperty: (nativeId: number, _name: string, picture: FakePicture) => {
      pictures.push({ nativeId, images: picture.images });
    },
  };
});

afterEach(() => {
  act(() => {
    chatScrollActivity.reset();
  });

  cleanup();

  act(() => {
    jest.advanceTimersByTime(10_000);
  });

  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  skiaModule.SkiaPictureView = originalPictureView;
  skiaModule.Canvas = originalCanvas;
  // SAFETY: removes the stand-in view API that beforeEach installed.
  delete (globalThis as { SkiaViewApi?: unknown }).SkiaViewApi;
});

interface RowProps {
  username: string;
  onRender: () => void;
}

function Row({ username, onRender }: RowProps) {
  return (
    <>
      <SharedPaintAnimationDrivers />
      <Profiler id='row' onRender={onRender}>
        <PaintedUsernameSkia username={username} paint={paint} />
      </Profiler>
    </>
  );
}

function getPictureView(rendered: ReturnType<typeof render>): FakePictureView {
  // SAFETY: UNSAFE_getByType matched a FakePictureView element, so its instance is one.
  return rendered.UNSAFE_getByType(FakePictureView).instance as FakePictureView;
}

describe('PaintedUsernameSkia texture frames', () => {
  test('draws each new texture frame without a React render', async () => {
    const onRender = jest.fn();
    const rendered = render(<Row username='alpha' onRender={onRender} />);

    await tick();

    const view = getPictureView(rendered);
    const rendersAfterLoad = onRender.mock.calls.length;

    await tick();
    await tick();

    expect({
      renders: onRender.mock.calls.length - rendersAfterLoad,
      lastPictures: picturesFor(view.nativeId).slice(-2),
    }).toEqual({
      renders: 0,
      lastPictures: [
        ['static', 'alpha#1', 'mask'],
        ['static', 'alpha#2', 'mask'],
      ],
    });
  });

  test('draws no texture frames while the list flings', async () => {
    const rendered = render(<Row username='alpha' onRender={() => {}} />);

    await tick();

    const view = getPictureView(rendered);
    const drawn = picturesFor(view.nativeId).length;

    act(() => {
      chatScrollActivity.poke();
    });

    await tick();
    await tick();

    expect(picturesFor(view.nativeId).length).toBe(drawn);
  });

  test('a reused row drops the old texture and draws the new one', async () => {
    const rendered = render(<Row username='alpha' onRender={() => {}} />);

    await tick();

    const view = getPictureView(rendered);

    rendered.rerender(<Row username='beta' onRender={() => {}} />);

    await tick();

    const alphaDecodes = decodeCounts.get('alpha') ?? 0;
    const drawnBefore = picturesFor(view.nativeId).length;

    await tick();
    await tick();

    const drawnAfter = picturesFor(view.nativeId).slice(drawnBefore);

    expect({
      sameView: getPictureView(rendered) === view,
      alphaDecodes: decodeCounts.get('alpha') ?? 0,
      drawnAfter,
    }).toEqual({
      sameView: true,
      alphaDecodes,
      drawnAfter: [
        ['static', 'beta#1', 'mask'],
        ['static', 'beta#2', 'mask'],
      ],
    });
  });

  test('a static paint does not redraw or render on a texture frame', async () => {
    const onStaticRender = jest.fn();

    const rendered = render(
      <>
        <Row username='alpha' onRender={() => {}} />
        <Profiler id='static' onRender={onStaticRender}>
          <PaintedUsernameSkia username='static' paint={paint} />
        </Profiler>
      </>,
    );

    await tick();

    const animatedView = getPictureView(rendered);

    // SAFETY: UNSAFE_getByType matched a FakeCanvas element, so its instance is one.
    const staticCanvas = rendered.UNSAFE_getByType(FakeCanvas)
      .instance as FakeCanvas;

    const rendersAfterLoad = onStaticRender.mock.calls.length;
    const redrawsAfterLoad = staticCanvas.redraw.mock.calls.length;
    const picturesAfterLoad = pictures.length;

    await tick();
    await tick();

    expect({
      renders: onStaticRender.mock.calls.length - rendersAfterLoad,
      redraws: staticCanvas.redraw.mock.calls.length - redrawsAfterLoad,
      pictureViews: [
        ...new Set(
          pictures.slice(picturesAfterLoad).map(picture => picture.nativeId),
        ),
      ],
    }).toEqual({
      renders: 0,
      redraws: 0,
      pictureViews: [animatedView.nativeId],
    });
  });
});

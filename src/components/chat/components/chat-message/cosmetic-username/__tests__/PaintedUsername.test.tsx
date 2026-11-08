// "shape" is the 7TV paint API field (types/seven-tv/cosmetics.ts), not a naming choice.
import { type ElementType } from 'react';
import { StyleSheet } from 'react-native';

import { Image } from '@shopify/react-native-skia';
import { act, render, screen } from '@testing-library/react-native';

import { chatScrollActivity } from '@app/components/chat/util/chatScrollActivity';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { paintRendererFlag$ } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import { PaintedUsername } from '../PaintedUsername';
import { PaintLayerStretchImage } from '../PaintLayerStretchImage';
import { PaintLayerTiledImage } from '../PaintLayerTiledImage';
import {
  makeLayer,
  makePaint,
} from '../util/paint-css/__fixtures__/paintCss.fixture';
import * as sharedPaintAnimationFrames from '../util/sharedPaintAnimationFrames';

/**
 * Pin the texture state: the jest Skia mock resolves Data.fromURI a microtask
 * after mount, after the assertions run.
 */
const frameSpy = jest.spyOn(
  sharedPaintAnimationFrames,
  'useSharedPaintAnimationFrame',
);

const readySpy = jest.spyOn(
  sharedPaintAnimationFrames,
  'useSharedPaintAnimationReady',
);

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const STORE_PAINT = makePaint({
  id: 'store-paint',
  function: 'URL',
  color: rgbaToSevenTvColor(255, 128, 0, 255),
  image_url: 'https://cdn.7tv.app/paint/store/2x.webp',
});

const hasVisibleUsernameInColor = (
  nodes: ReturnType<typeof screen.getAllByText>,
  expectedColor: string,
): boolean =>
  nodes.some(node => {
    const style = StyleSheet.flatten(node.props['style']) ?? {};
    return style.color === expectedColor && style.opacity !== 0;
  });

const TWITCH_COLOR = 'rgb(0, 0, 255)';

const GRADIENT_PAINT = makePaint({
  name: 'Gradient',
  angle: 90,
  layers: {
    0: makeLayer({
      stops: {
        0: { at: 0, color: 0xff_00_00_ff },
        1: { at: 0.5, color: 0x00_ff_00_ff },
        length: 2,
      },
      angle: 90,
    }),
    length: 1,
  },
});

const URL_LAYER = makeLayer({
  function: 'URL',
  image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
});

beforeEach(() => {
  paintRendererFlag$.set('native');
  frameSpy.mockReturnValue(null);
});

describe('PaintedUsername with a decoded texture', () => {
  beforeEach(() => {
    readySpy.mockReturnValue(true);
  });

  describe('Rendering', () => {
    test('renders the plain username in the chat colour when the renderer flag is off', () => {
      paintRendererFlag$.set('off');

      const linearPaint = makePaint({
        function: 'LINEAR_GRADIENT',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

      const { getAllByText, queryByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='OffUser'
          paint={linearPaint}
          fallbackColor='#12AB34'
        />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(getAllByText('OffUser:'), '#12AB34'),
      ).toBe(true);
    });

    test('renders the plain username in the fallback colour when no paint provided', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='TestUser'
          fallbackColor='#FF0000'
        />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(getAllByText('TestUser:'), '#FF0000'),
      ).toBe(true);
    });

    test('falls back to the theme default colour when none is provided', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername isModerated={false} username='TestUser' />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(
          getAllByText('TestUser:'),
          theme.color.text.dark,
        ),
      ).toBe(true);
    });

    test('renders the masked painted fill for a linear gradient paint', () => {
      const linearPaint = makePaint({
        function: 'LINEAR_GRADIENT',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='GradientUser'
          paint={linearPaint}
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('renders the masked painted fill for a radial gradient paint', () => {
      const radialPaint = makePaint({
        function: 'RADIAL_GRADIENT',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='RadialUser'
          paint={radialPaint}
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('appends a colon to the username', () => {
      const { getByText } = render(
        <PaintedUsername isModerated={false} username='UserName' />,
      );

      expect(getByText('UserName:')).toBeOnTheScreen();
    });

    test('omits the colon when showColon is false', () => {
      const { getByText, queryByText } = render(
        <PaintedUsername
          isModerated={false}
          username='UserName'
          showColon={false}
        />,
      );

      expect(getByText('UserName')).toBeOnTheScreen();

      expect(queryByText('UserName:')).not.toBeOnTheScreen();
    });
  });

  describe('Gradient Configuration', () => {
    test('paints the solid fallback colour behind the mask when stops are empty', () => {
      const emptyStopsPaint = makePaint({
        stops: { length: 0 },
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='EmptyStops'
          paint={emptyStopsPaint}
          fallbackColor='#1AC9A2'
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(getAllByText('EmptyStops:'), '#1AC9A2'),
      ).toBe(true);
    });

    test("resolves a URL paint's solid base colour from the packed color field", () => {
      const urlPaint = makePaint({
        function: 'URL',
        color: rgbaToSevenTvColor(255, 128, 0, 255),
        image_url: 'https://example.com/paint.png',
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='UrlPaint'
          paint={urlPaint}
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(
          getAllByText('UrlPaint:'),
          'rgba(255, 128, 0, 1.000)',
        ),
      ).toBe(true);
    });

    test('renders URL paint as a tiled Skia layer when repeating', () => {
      const urlPaint = makePaint({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test/2x.webp',
        repeat: true,
      });

      const { UNSAFE_getByType } = render(
        <PaintedUsername
          isModerated={false}
          username='AssetRepeat'
          paint={urlPaint}
        />,
      );

      const tiledLayer = UNSAFE_getByType(PaintLayerTiledImage);

      expect(tiledLayer.props['imageUrl']).toBe(
        'https://cdn.7tv.app/paint/test/2x.webp',
      );
    });

    test('draws a non-repeating URL paint from the shared frame clock', () => {
      const urlPaint = makePaint({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test/4x.webp',
        repeat: false,
      });

      const { UNSAFE_getByType } = render(
        <PaintedUsername
          isModerated={false}
          username='AssetFill'
          paint={urlPaint}
        />,
      );

      const paintImage = UNSAFE_getByType(PaintLayerStretchImage);

      expect(paintImage.props['imageUrl']).toBe(
        'https://cdn.7tv.app/paint/test/4x.webp',
      );
    });

    test('loads the webp sibling when the paint url is avif', () => {
      const urlPaint = makePaint({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test/4x.avif',
        repeat: false,
      });

      const { UNSAFE_getByType } = render(
        <PaintedUsername
          isModerated={false}
          username='AssetFill'
          paint={urlPaint}
        />,
      );

      const paintImage = UNSAFE_getByType(PaintLayerStretchImage);

      expect(paintImage.props['imageUrl']).toBe(
        'https://cdn.7tv.app/paint/test/4x.webp',
      );
    });

    test('stretches the shared frame to the glyph box', () => {
      const frame = { width: () => 4, height: () => 4 };
      frameSpy.mockReturnValue(
        // SAFETY: the stretch canvas only forwards this object to the Skia Image prop.
        frame as never,
      );

      const rendered = render(
        <PaintLayerStretchImage imageUrl='https://cdn.7tv.app/paint/test/4x.webp' />,
      );

      // SAFETY: react-test-renderer records host views under the string "View".
      const view = rendered.UNSAFE_root.findByType('View' as ElementType);

      act(() => {
        view.props['onLayout']({
          nativeEvent: { layout: { width: 40, height: 16, x: 0, y: 0 } },
        });
      });

      const image = rendered.UNSAFE_getByType(Image);

      expect({
        image: image.props['image'],
        x: image.props['x'],
        y: image.props['y'],
        width: image.props['width'],
        height: image.props['height'],
        fit: image.props['fit'],
      }).toEqual({
        image: frame,
        x: 0,
        y: 0,
        width: 40,
        height: 16,
        fit: 'fill',
      });
    });
  });

  describe('Store Lookup', () => {
    afterEach(() => {
      chatStore$.paints.set({});
      chatStore$.userPaintIds.set({});
    });

    test('renders the plain fallback when the userId is absent from the store', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='UnknownUser'
          userId='unknown-user-id'
          fallbackColor='#CCCCCC'
        />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(getAllByText('UnknownUser:'), '#CCCCCC'),
      ).toBe(true);
    });

    test('paints the stored paint for a userId in the store', () => {
      chatStore$.paints.set({ 'store-paint': STORE_PAINT });
      chatStore$.userPaintIds.set({ 'some-user-id': 'store-paint' });

      const { getAllByText } = render(
        <PaintedUsername
          isModerated={false}
          username='StoredPaint'
          userId='some-user-id'
          fallbackColor='#1AC9A2'
        />,
      );

      expect(
        hasVisibleUsernameInColor(
          getAllByText('StoredPaint:'),
          'rgba(255, 128, 0, 1.000)',
        ),
      ).toBe(true);
    });

    test('prefers the paint prop over the userId store lookup', () => {
      chatStore$.paints.set({ 'store-paint': STORE_PAINT });
      chatStore$.userPaintIds.set({ 'some-user-id': 'store-paint' });

      const directPaint = makePaint({
        id: 'direct-paint',
        name: 'Direct Paint',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 255, 0, 255) },
          length: 2,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername
          isModerated={false}
          username='DirectPaint'
          paint={directPaint}
          userId='some-user-id'
          fallbackColor='#1AC9A2'
        />,
      );

      expect(
        hasVisibleUsernameInColor(getAllByText('DirectPaint:'), '#1AC9A2'),
      ).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('keeps a visible colon-only label for an empty username', () => {
      const { getByText, queryByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username=''
          fallbackColor='#CCCCCC'
        />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(getByText(':')).toBeOnTheScreen();
    });

    test('renders special characters verbatim', () => {
      const { getByText } = render(
        <PaintedUsername isModerated={false} username='User_Name-123' />,
      );

      expect(getByText('User_Name-123:')).toBeOnTheScreen();
    });

    test('renders unicode characters verbatim', () => {
      const { getByText } = render(
        <PaintedUsername isModerated={false} username='用户名' />,
      );

      expect(getByText('用户名:')).toBeOnTheScreen();
    });

    test('uses the fallback colour when the paint color field is null', () => {
      const paintWithNullColor = makePaint({
        color: null,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 100, 100, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(200, 200, 200, 255) },
          length: 2,
        },
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername
          isModerated={false}
          username='NullColor'
          paint={paintWithNullColor}
          fallbackColor='#1AC9A2'
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();

      expect(
        hasVisibleUsernameInColor(getAllByText('NullColor:'), '#1AC9A2'),
      ).toBe(true);
    });
  });

  describe('Scroll-gated flatten', () => {
    afterEach(() => {
      act(() => {
        chatScrollActivity.reset();
      });
    });

    const gradientPaint = () =>
      makePaint({
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

    test('skips the MaskedView offscreen pass while actively scrolling', () => {
      chatScrollActivity.poke();

      const { queryByTestId, getByText } = render(
        <PaintedUsername
          isModerated={false}
          username='Scrolling'
          paint={gradientPaint()}
        />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();

      expect(getByText('Scrolling:')).toBeOnTheScreen();
    });
  });
});

describe('PaintedUsername before the texture decodes', () => {
  beforeEach(() => {
    readySpy.mockReturnValue(false);
  });

  afterEach(() => {
    act(() => {
      chatScrollActivity.reset();
    });
  });

  test('paints the name through the masked fill at rest', () => {
    render(
      <PaintedUsername
        isModerated={false}
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    expect(screen.getByTestId('masked-view')).toBeOnTheScreen();
  });

  test('holds a paint colour while the list is flinging', () => {
    render(
      <PaintedUsername
        isModerated={false}
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    act(() => {
      chatScrollActivity.poke();
    });

    expect(screen.queryByTestId('masked-view')).toBeNull();

    expect(screen.getByText('luke')).toHaveStyle({
      color: 'rgba(0, 255, 0, 1.000)',
    });
  });

  test('falls back to the chat colour for a paint with no colour of its own', () => {
    render(
      <PaintedUsername
        isModerated={false}
        username='luke'
        paint={{
          ...GRADIENT_PAINT,
          layers: { 0: URL_LAYER, length: 1 },
        }}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    act(() => {
      chatScrollActivity.poke();
    });

    expect(screen.getByText('luke')).toHaveStyle({ color: TWITCH_COLOR });
  });

  test('keeps a Twitch-coloured base under a URL paint', () => {
    render(
      <PaintedUsername
        isModerated={false}
        username='luke'
        paint={{
          ...GRADIENT_PAINT,
          function: 'URL',
          image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
          layers: { 0: URL_LAYER, length: 1 },
        }}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    expect(screen.queryByTestId('masked-view')).toBeNull();

    expect(screen.getByText('luke')).toHaveStyle({ color: TWITCH_COLOR });
  });

  test('keeps a moderated name off Skia so the strikethrough draws', () => {
    paintRendererFlag$.set('skia');

    render(
      <PaintedUsername
        isModerated
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
        usernameTextStyle={{ textDecorationLine: 'line-through' }}
      />,
    );

    expect(screen.getByTestId('masked-view')).toBeOnTheScreen();
  });

  test('draws a name that is not moderated with Skia', () => {
    paintRendererFlag$.set('skia');

    render(
      <PaintedUsername
        isModerated={false}
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    expect(screen.queryByTestId('masked-view')).toBeNull();
  });
});

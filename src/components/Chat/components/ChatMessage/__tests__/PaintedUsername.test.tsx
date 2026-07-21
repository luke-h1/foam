import { StyleSheet } from 'react-native';

import { act, render } from '@testing-library/react-native';
import { Image } from 'expo-image';

import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';
import { paintRendererFlag$ } from '@app/store/preferences/state';
import { theme } from '@app/styles/themes';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { PaintedUsername } from '../CosmeticUsername/PaintedUsername';
import { PaintLayerTiledImage } from '../CosmeticUsername/PaintLayerTiledImage';

jest.mock('expo-image', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    Image: (props: object) =>
      React.createElement(View, { testID: 'expo-image', ...props }),
  };
});

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    userPaintIds: {},
    paints: {},
  },
}));

/**
 * Helper to convert RGBA values to 7TV packed color format
 */
function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const createPaintData = (overrides: Partial<PaintData> = {}): PaintData => ({
  id: 'paint-1',
  name: 'Test Paint',
  color: null,
  layers: { length: 0 },
  shadows: { length: 0 },
  textStyle: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
  ...overrides,
});

/**
 * The username is rendered several times in the painted tree (the in-flow
 * solid base, the mask glyph, the hidden fill sizer, and any shadow layers).
 * The one the viewer actually sees as the base colour is the in-flow solid
 * Text: it carries `expectedColor` and is not the opacity:0 sizer. Asserting
 * on it verifies the paint's base colour resolved correctly, not merely that
 * the username string rendered somewhere.
 */
const hasVisibleUsernameInColor = (
  nodes: ReturnType<ReturnType<typeof render>['getAllByText']>,
  expectedColor: string,
): boolean =>
  nodes.some(node => {
    const style = StyleSheet.flatten(node.props.style) ?? {};
    return style.color === expectedColor && style.opacity !== 0;
  });

describe('PaintedUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders the plain username in the chat colour when the renderer flag is off', () => {
      paintRendererFlag$.set('off');
      try {
        const linearPaint = createPaintData({
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
            username='OffUser'
            paint={linearPaint}
            fallbackColor='#12AB34'
          />,
        );

        expect(queryByTestId('masked-view')).not.toBeOnTheScreen();
        expect(
          hasVisibleUsernameInColor(getAllByText('OffUser:'), '#12AB34'),
        ).toBe(true);
      } finally {
        paintRendererFlag$.set('native');
      }
    });

    test('renders the plain username in the fallback colour when no paint provided', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername username='TestUser' fallbackColor='#FF0000' />,
      );

      // No paint means no MaskedView offscreen pass: just the solid username.
      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();
      expect(
        hasVisibleUsernameInColor(getAllByText('TestUser:'), '#FF0000'),
      ).toBe(true);
    });

    test('falls back to the theme default colour when none is provided', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername username='TestUser' />,
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
      const linearPaint = createPaintData({
        function: 'LINEAR_GRADIENT',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='GradientUser' paint={linearPaint} />,
      );

      // The painted branch was taken (not the plain-text fallback path).
      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('renders the masked painted fill for a radial gradient paint', () => {
      const radialPaint = createPaintData({
        function: 'RADIAL_GRADIENT',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='RadialUser' paint={radialPaint} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('appends a colon to the username', () => {
      const { getByText } = render(<PaintedUsername username='UserName' />);

      expect(getByText('UserName:')).toBeOnTheScreen();
    });

    test('omits the colon when showColon is false', () => {
      const { getByText, queryByText } = render(
        <PaintedUsername username='UserName' showColon={false} />,
      );

      expect(getByText('UserName')).toBeOnTheScreen();
      expect(queryByText('UserName:')).not.toBeOnTheScreen();
    });
  });

  describe('Gradient Configuration', () => {
    test('paints the solid fallback colour behind the mask when stops are empty', () => {
      const emptyStopsPaint = createPaintData({
        stops: { length: 0 },
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername
          username='EmptyStops'
          paint={emptyStopsPaint}
          fallbackColor='#1AC9A2'
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
      // With no gradient stops the base colour must resolve to the fallback so
      // the glyphs are never left transparent.
      expect(
        hasVisibleUsernameInColor(getAllByText('EmptyStops:'), '#1AC9A2'),
      ).toBe(true);
    });

    test("resolves a URL paint's solid base colour from the packed color field", () => {
      const urlPaint = createPaintData({
        function: 'URL',
        color: rgbaToSevenTvColor(255, 128, 0, 255),
        image_url: 'https://example.com/paint.png',
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername username='UrlPaint' paint={urlPaint} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
      // 7TV packs RGBA as 0xRRGGBBAA; the base colour is the CSS rgba() form.
      expect(
        hasVisibleUsernameInColor(
          getAllByText('UrlPaint:'),
          'rgba(255, 128, 0, 1.000)',
        ),
      ).toBe(true);
    });

    test('should render URL paint as a tiled Skia layer when repeating', () => {
      const urlPaint = createPaintData({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test/2x.webp',
        repeat: true,
      });

      const { UNSAFE_getByType } = render(
        <PaintedUsername username='AssetRepeat' paint={urlPaint} />,
      );

      const tiledLayer = UNSAFE_getByType(PaintLayerTiledImage);
      expect(tiledLayer.props.imageUrl).toBe(
        'https://cdn.7tv.app/paint/test/2x.webp',
      );
    });

    test('should stretch a non-repeating URL paint to fill the glyph box', () => {
      const urlPaint = createPaintData({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test/4x.webp',
        repeat: false,
      });

      const { UNSAFE_getByType } = render(
        <PaintedUsername username='AssetFill' paint={urlPaint} />,
      );

      const paintImage = UNSAFE_getByType(Image);
      expect(paintImage.props.contentFit).toBe('fill');
    });

    test('renders the masked fill for a single-stop gradient', () => {
      const singleStopPaint = createPaintData({
        stops: {
          0: { at: 0.5, color: rgbaToSevenTvColor(128, 0, 128, 255) },
          length: 1,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='SingleStop' paint={singleStopPaint} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('renders the masked fill for a multi-stop gradient', () => {
      const multiStopPaint = createPaintData({
        angle: 45,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 0.25, color: rgbaToSevenTvColor(255, 128, 0, 255) },
          2: { at: 0.5, color: rgbaToSevenTvColor(255, 255, 0, 255) },
          3: { at: 0.75, color: rgbaToSevenTvColor(0, 255, 0, 255) },
          4: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 5,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='Rainbow' paint={multiStopPaint} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });
  });

  describe('Shadow Effects', () => {
    test('should handle paint with shadows', () => {
      const paintWithShadow = createPaintData({
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(254, 118, 148, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
          length: 2,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(254, 118, 148, 255),
            radius: 4,
            x_offset: 2,
            y_offset: 2,
          },
          length: 1,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='ShadowUser' paint={paintWithShadow} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('should handle paint with multiple shadows (uses first)', () => {
      const paintWithMultipleShadows = createPaintData({
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(200, 100, 50, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(150, 75, 25, 255) },
          length: 2,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(0, 0, 0, 255),
            radius: 2,
            x_offset: 1,
            y_offset: 1,
          },
          1: {
            color: rgbaToSevenTvColor(255, 255, 255, 255),
            radius: 4,
            x_offset: 0,
            y_offset: 0,
          },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername
          username='MultipleShadows'
          paint={paintWithMultipleShadows}
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('should handle paint with no shadows', () => {
      const paintWithoutShadow = createPaintData({
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(150, 100, 200, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(130, 80, 180, 255) },
          length: 2,
        },
        shadows: { length: 0 },
      });

      const { getByTestId } = render(
        <PaintedUsername username='NoShadow' paint={paintWithoutShadow} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });
  });

  describe('Angle Handling', () => {
    /**
     * NOTE: exact gradient angle->coordinate math is asserted at the unit level
     * in the paintLayer helper tests. Here we only guard that every angle keeps
     * the paint on the masked-gradient render path (a NaN/throw in the angle
     * math would collapse it to the plain-text fallback, dropping masked-view).
     */
    test.each([0, 45, 90, 135, 180, 225, 270, 315])(
      'keeps the masked gradient render path at %d degrees',
      angle => {
        const anglePaint = createPaintData({
          angle,
          stops: {
            0: { at: 0, color: rgbaToSevenTvColor(160, 59, 254, 255) },
            1: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
            length: 2,
          },
        });

        const { getByTestId } = render(
          <PaintedUsername username={`Angle${angle}`} paint={anglePaint} />,
        );

        expect(getByTestId('masked-view')).toBeOnTheScreen();
      },
    );

    test('renders the masked gradient when the angle is undefined', () => {
      const noAnglePaint = createPaintData({
        angle: undefined,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 100, 100, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(200, 200, 200, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername username='NoAngle' paint={noAnglePaint} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });
  });

  describe('Store Lookup', () => {
    test('renders the plain fallback when the userId is absent from the store', () => {
      const { getAllByText, queryByTestId } = render(
        <PaintedUsername
          username='UnknownUser'
          userId='unknown-user-id'
          fallbackColor='#CCCCCC'
        />,
      );

      // A store miss must not paint: no masked pass, plain fallback colour.
      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();
      expect(
        hasVisibleUsernameInColor(getAllByText('UnknownUser:'), '#CCCCCC'),
      ).toBe(true);
    });

    test('prefers the paint prop over the userId store lookup', () => {
      const directPaint = createPaintData({
        id: 'direct-paint',
        name: 'Direct Paint',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 255, 0, 255) },
          length: 2,
        },
      });

      const { getByTestId } = render(
        <PaintedUsername
          username='DirectPaint'
          paint={directPaint}
          userId='some-user-id'
        />,
      );

      // The explicit paint prop wins, so the masked painted fill renders.
      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });
  });

  describe('Edge Cases', () => {
    test('keeps a visible colon-only label for an empty username', () => {
      const { getByText, queryByTestId } = render(
        <PaintedUsername username='' fallbackColor='#CCCCCC' />,
      );

      // Guards the blank-row regression: an empty name must still show ": ".
      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();
      expect(getByText(':')).toBeOnTheScreen();
    });

    test('renders special characters verbatim', () => {
      const { getByText } = render(
        <PaintedUsername username='User_Name-123' />,
      );

      expect(getByText('User_Name-123:')).toBeOnTheScreen();
    });

    test('renders unicode characters verbatim', () => {
      const { getByText } = render(<PaintedUsername username='用户名' />);

      expect(getByText('用户名:')).toBeOnTheScreen();
    });

    test('uses the fallback colour when the paint color field is null', () => {
      const paintWithNullColor = createPaintData({
        color: null,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 100, 100, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(200, 200, 200, 255) },
          length: 2,
        },
      });

      const { getAllByText, getByTestId } = render(
        <PaintedUsername
          username='NullColor'
          paint={paintWithNullColor}
          fallbackColor='#1AC9A2'
        />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
      // color === null must resolve the base to the supplied fallback.
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
      createPaintData({
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

    test('renders the painted MaskedView when the list is idle', () => {
      const { getByTestId } = render(
        <PaintedUsername username='Idle' paint={gradientPaint()} />,
      );

      expect(getByTestId('masked-view')).toBeOnTheScreen();
    });

    test('skips the MaskedView offscreen pass while actively scrolling', () => {
      chatScrollActivity.poke();

      const { queryByTestId, getByText } = render(
        <PaintedUsername username='Scrolling' paint={gradientPaint()} />,
      );

      expect(queryByTestId('masked-view')).not.toBeOnTheScreen();
      // Flattened during the fling: a single plain solid username, no mask.
      expect(getByText('Scrolling:')).toBeOnTheScreen();
    });

    test('keeps a visible solid-colour username behind the mask when idle', () => {
      /**
       * The MaskedView paints the gradient over an in-flow solid username. If
       * that offscreen pass drops out on a settling row, the solid username must
       * still be visible - otherwise the row reserves its space but renders a
       * blank gap where the name should be. Guard the fallback stays opaque.
       */
      const fallbackColor = '#1AC9A2';

      const { getAllByText } = render(
        <PaintedUsername
          username='Idle'
          paint={gradientPaint()}
          fallbackColor={fallbackColor}
        />,
      );

      const hasVisibleSolidUsername = getAllByText('Idle:').some(node => {
        const style = StyleSheet.flatten(node.props.style) ?? {};
        return style.color === fallbackColor && style.opacity !== 0;
      });

      expect(hasVisibleSolidUsername).toBe(true);
    });
  });
});

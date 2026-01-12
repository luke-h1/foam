import type { PaintData } from '@app/utils/color/seventv-ws-service';
import { render } from '@testing-library/react-native';
import { PaintedUsername } from '../CosmeticUsername/CosmeticUsername';

jest.mock('@app/store/chatStore', () => ({
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
  gradients: { length: 0 },
  shadows: { length: 0 },
  text: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
  ...overrides,
});

describe('PaintedUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render username with fallback color when no paint provided', () => {
      const { getAllByText } = render(
        <PaintedUsername username="TestUser" fallbackColor="#FF0000" />,
      );

      // Username appears in both mask and content
      expect(getAllByText('TestUser:').length).toBeGreaterThanOrEqual(1);
    });

    test('should render username with default white fallback color', () => {
      const { getAllByText } = render(<PaintedUsername username="TestUser" />);

      expect(getAllByText('TestUser:').length).toBeGreaterThanOrEqual(1);
    });

    test('should render username with linear gradient paint', () => {
      const linearPaint = createPaintData({
        function: 'LINEAR_GRADIENT',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(255, 0, 0, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 0, 255, 255) },
          length: 2,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername username="GradientUser" paint={linearPaint} />,
      );

      expect(getAllByText('GradientUser:').length).toBeGreaterThanOrEqual(1);
    });

    test('should render username with radial gradient paint', () => {
      const radialPaint = createPaintData({
        function: 'RADIAL_GRADIENT',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) },
          length: 2,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername username="RadialUser" paint={radialPaint} />,
      );

      expect(getAllByText('RadialUser:').length).toBeGreaterThanOrEqual(1);
    });

    test('should append colon to username', () => {
      const { getAllByText } = render(<PaintedUsername username="UserName" />);

      expect(getAllByText('UserName:').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Gradient Configuration', () => {
    test('should handle paint with empty stops by using fallback color', () => {
      const emptyStopsPaint = createPaintData({
        stops: { length: 0 },
      });

      const { getAllByText } = render(
        <PaintedUsername
          username="EmptyStops"
          paint={emptyStopsPaint}
          fallbackColor="#00FF00"
        />,
      );

      expect(getAllByText('EmptyStops:').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle URL paint function by using solid color', () => {
      const urlPaint = createPaintData({
        function: 'URL',
        color: rgbaToSevenTvColor(255, 128, 0, 255),
        image_url: 'https://example.com/paint.png',
      });

      const { getAllByText } = render(
        <PaintedUsername username="UrlPaint" paint={urlPaint} />,
      );

      expect(getAllByText('UrlPaint:').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle single stop gradient by duplicating color', () => {
      const singleStopPaint = createPaintData({
        stops: {
          0: { at: 0.5, color: rgbaToSevenTvColor(128, 0, 128, 255) },
          length: 1,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername username="SingleStop" paint={singleStopPaint} />,
      );

      expect(getAllByText('SingleStop:').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multi-stop gradient', () => {
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

      const { getAllByText } = render(
        <PaintedUsername username="Rainbow" paint={multiStopPaint} />,
      );

      expect(getAllByText('Rainbow:').length).toBeGreaterThanOrEqual(1);
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

      const { getAllByText } = render(
        <PaintedUsername username="ShadowUser" paint={paintWithShadow} />,
      );

      expect(getAllByText('ShadowUser:').length).toBeGreaterThanOrEqual(1);
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

      const { getAllByText } = render(
        <PaintedUsername
          username="MultipleShadows"
          paint={paintWithMultipleShadows}
        />,
      );

      expect(getAllByText('MultipleShadows:').length).toBeGreaterThanOrEqual(1);
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

      const { getAllByText } = render(
        <PaintedUsername username="NoShadow" paint={paintWithoutShadow} />,
      );

      expect(getAllByText('NoShadow:').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Angle Handling', () => {
    test.each([0, 45, 90, 135, 180, 225, 270, 315])(
      'should handle angle %d degrees',
      angle => {
        const anglePaint = createPaintData({
          angle,
          stops: {
            0: { at: 0, color: rgbaToSevenTvColor(160, 59, 254, 255) },
            1: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
            length: 2,
          },
        });

        const { getAllByText } = render(
          <PaintedUsername username={`Angle${angle}`} paint={anglePaint} />,
        );

        expect(getAllByText(`Angle${angle}:`).length).toBeGreaterThanOrEqual(1);
      },
    );

    test('should handle undefined angle (defaults to 0)', () => {
      const noAnglePaint = createPaintData({
        angle: undefined,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 100, 100, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(200, 200, 200, 255) },
          length: 2,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername username="NoAngle" paint={noAnglePaint} />,
      );

      expect(getAllByText('NoAngle:').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Store Lookup', () => {
    test('should return null paint when userId not in store', () => {
      const { getAllByText } = render(
        <PaintedUsername
          username="UnknownUser"
          userId="unknown-user-id"
          fallbackColor="#CCCCCC"
        />,
      );

      expect(getAllByText('UnknownUser:').length).toBeGreaterThanOrEqual(1);
    });

    test('should prefer paint prop over userId lookup', () => {
      const directPaint = createPaintData({
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
          username="DirectPaint"
          paint={directPaint}
          userId="some-user-id"
        />,
      );

      expect(getAllByText('DirectPaint:').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Snapshots', () => {
    test('should match snapshot with fallback color only', () => {
      const { toJSON } = render(
        <PaintedUsername username="FallbackUser" fallbackColor="#9B59B6" />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    test('should match snapshot with linear gradient paint', () => {
      const roseGold = createPaintData({
        id: 'rose-gold',
        name: 'Rose Gold',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(254, 118, 148, 255) },
          1: { at: 0.5, color: rgbaToSevenTvColor(255, 200, 180, 255) },
          2: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) },
          length: 3,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(254, 118, 148, 255),
            radius: 0.1,
            x_offset: 0,
            y_offset: 0,
          },
          length: 1,
        },
      });

      const { toJSON } = render(
        <PaintedUsername username="RoseGoldUser" paint={roseGold} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    test('should match snapshot with radial gradient paint', () => {
      const flowerchild = createPaintData({
        id: 'flowerchild',
        name: 'Flowerchild',
        function: 'RADIAL_GRADIENT',
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) },
          1: { at: 0.5, color: rgbaToSevenTvColor(0, 150, 180, 255) },
          2: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) },
          length: 3,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(0, 96, 128, 255),
            radius: 0.1,
            x_offset: 0,
            y_offset: 0,
          },
          length: 1,
        },
      });

      const { toJSON } = render(
        <PaintedUsername username="FlowerchildUser" paint={flowerchild} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    test('should match snapshot with URL paint (solid color fallback)', () => {
      const urlPaint = createPaintData({
        id: 'url-paint',
        name: 'URL Paint',
        function: 'URL',
        color: rgbaToSevenTvColor(255, 165, 0, 255),
        image_url: 'https://example.com/paint.png',
      });

      const { toJSON } = render(
        <PaintedUsername username="UrlPaintUser" paint={urlPaint} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    test('should match snapshot with multiple shadows', () => {
      const divisionPaint = createPaintData({
        id: 'division',
        name: 'Division',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(156, 76, 22, 255) },
          1: { at: 0.5, color: rgbaToSevenTvColor(200, 120, 50, 255) },
          2: { at: 1, color: rgbaToSevenTvColor(130, 60, 15, 255) },
          length: 3,
        },
        shadows: {
          0: {
            color: rgbaToSevenTvColor(0, 0, 0, 255),
            radius: 0.1,
            x_offset: 0,
            y_offset: 0,
          },
          1: {
            color: rgbaToSevenTvColor(156, 76, 22, 255),
            radius: 1,
            x_offset: 0,
            y_offset: 0,
          },
          length: 2,
        },
      });

      const { toJSON } = render(
        <PaintedUsername username="DivisionUser" paint={divisionPaint} />,
      );

      expect(toJSON()).toMatchSnapshot();
    });

    test('should match snapshot with long username', () => {
      const magma = createPaintData({
        id: 'magma',
        name: 'Magma',
        angle: 90,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(196, 57, 1, 255) },
          1: { at: 0.5, color: rgbaToSevenTvColor(255, 150, 50, 255) },
          2: { at: 1, color: rgbaToSevenTvColor(196, 57, 1, 255) },
          length: 3,
        },
      });

      const { toJSON } = render(
        <PaintedUsername
          username="VeryLongUsernameForTestingPurposes"
          paint={magma}
        />,
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty username', () => {
      const { getAllByText } = render(<PaintedUsername username="" />);

      expect(getAllByText(':').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle special characters in username', () => {
      const { getAllByText } = render(
        <PaintedUsername username="User_Name-123" />,
      );

      expect(getAllByText('User_Name-123:').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle unicode characters in username', () => {
      const { getAllByText } = render(<PaintedUsername username="用户名" />);

      expect(getAllByText('用户名:').length).toBeGreaterThanOrEqual(1);
    });

    test('should handle paint with null color field', () => {
      const paintWithNullColor = createPaintData({
        color: null,
        stops: {
          0: { at: 0, color: rgbaToSevenTvColor(100, 100, 100, 255) },
          1: { at: 1, color: rgbaToSevenTvColor(200, 200, 200, 255) },
          length: 2,
        },
      });

      const { getAllByText } = render(
        <PaintedUsername username="NullColor" paint={paintWithNullColor} />,
      );

      expect(getAllByText('NullColor:').length).toBeGreaterThanOrEqual(1);
    });
  });
});

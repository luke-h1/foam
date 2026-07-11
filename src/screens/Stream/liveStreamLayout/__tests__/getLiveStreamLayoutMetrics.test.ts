import { getLiveStreamLayoutMetrics } from '../getLiveStreamLayoutMetrics';

describe('getLiveStreamLayoutMetrics', () => {
  test('uses actual window dimensions for landscape absolute layout', () => {
    expect(
      getLiveStreamLayoutMetrics({
        insetTop: 44,
        windowHeight: 430,
        windowWidth: 932,
      }),
    ).toEqual({
      isLandscape: true,
      layoutHeight: 430,
      portraitTopInset: 0,
      screenHeight: 430,
      screenWidth: 932,
    });
  });

  test('subtracts the top safe inset only in portrait', () => {
    expect(
      getLiveStreamLayoutMetrics({
        insetTop: 44,
        windowHeight: 932,
        windowWidth: 430,
      }),
    ).toEqual({
      isLandscape: false,
      layoutHeight: 888,
      portraitTopInset: 44,
      screenHeight: 932,
      screenWidth: 430,
    });
  });
});

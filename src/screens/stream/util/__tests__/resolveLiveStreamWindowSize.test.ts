import {
  resolveLiveStreamWindowSize,
  trustDeviceOrientationOnPlatform,
} from '../resolveLiveStreamWindowSize';

describe('resolveLiveStreamWindowSize', () => {
  test('keeps the window when iOS 27 will not honour a lock', () => {
    expect(
      resolveLiveStreamWindowSize({
        deviceLandscape: false,
        trustDeviceOrientation: false,
        windowDimsStuck: true,
        windowHeight: 430,
        windowWidth: 932,
      }),
    ).toEqual({ height: 430, width: 932 });
  });

  test('uses the device orientation when the window size is stuck on an older OS', () => {
    expect(
      resolveLiveStreamWindowSize({
        deviceLandscape: true,
        trustDeviceOrientation: true,
        windowDimsStuck: true,
        windowHeight: 932,
        windowWidth: 430,
      }),
    ).toEqual({ height: 430, width: 932 });
  });

  test('uses the window while a rotation is still in progress', () => {
    expect(
      resolveLiveStreamWindowSize({
        deviceLandscape: true,
        trustDeviceOrientation: true,
        windowDimsStuck: false,
        windowHeight: 932,
        windowWidth: 430,
      }),
    ).toEqual({ height: 932, width: 430 });
  });
});

describe('trustDeviceOrientationOnPlatform', () => {
  test('trusts the device orientation off iOS and before iOS 27', () => {
    expect(trustDeviceOrientationOnPlatform('android', 36)).toEqual(true);

    expect(trustDeviceOrientationOnPlatform('ios', '26.5')).toEqual(true);
  });

  test('stops trusting the device orientation on iOS 27', () => {
    expect(trustDeviceOrientationOnPlatform('ios', '27.0')).toEqual(false);

    expect(trustDeviceOrientationOnPlatform('ios', 27)).toEqual(false);
  });
});

jest.unmock('@app/utils/device/deviceTier');

interface MockDeviceInfo {
  isLowRamDevice?: () => boolean;
  getTotalMemorySync?: () => number;
}

const GB = 1024 * 1024 * 1024;

function tierFor(info: MockDeviceInfo): string {
  let result = '';
  jest.isolateModules(() => {
    jest.doMock('react-native-device-info', () => ({
      __esModule: true,
      default: info,
    }));
    result = require('@app/utils/device/deviceTier').getDeviceTier() as string;
  });
  return result;
}

describe('getDeviceTier', () => {
  test('high-RAM device is high tier', () => {
    expect(
      tierFor({
        isLowRamDevice: () => false,
        getTotalMemorySync: () => 8 * GB,
      }),
    ).toBe('high');
  });

  test('an Android low-RAM device is low tier', () => {
    expect(
      tierFor({ isLowRamDevice: () => true, getTotalMemorySync: () => 8 * GB }),
    ).toBe('low');
  });

  test('under 3GB total memory is low tier', () => {
    expect(
      tierFor({
        isLowRamDevice: () => false,
        getTotalMemorySync: () => 2 * GB,
      }),
    ).toBe('low');
  });

  test('a throwing native call defaults to high tier', () => {
    expect(
      tierFor({
        isLowRamDevice: () => {
          throw new Error('native unavailable');
        },
        getTotalMemorySync: () => 0,
      }),
    ).toBe('high');
  });
});

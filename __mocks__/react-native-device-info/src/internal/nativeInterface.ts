/**
 * Fake of react-native-device-info's native interface. The real module throws
 * at import time when NativeModules.RNDeviceInfo is missing (always true under
 * Jest), so src/utils/device/device-tier.ts cannot import it in tests.
 *
 * device-tier.ts caches its result at module scope, so its tests re-require it
 * for each case with jest.isolateModules. That also gives this mock a new
 * instance, so the configured device info lives on globalThis, where it
 * survives the re-require.
 */
export interface MockDeviceInfo {
  isLowRamDevice?: boolean;
  getTotalMemorySync?: () => number;
  getUsedMemory?: () => Promise<number>;
}

const DEFAULT_DEVICE_INFO: MockDeviceInfo = {
  isLowRamDevice: false,
  getTotalMemorySync: () => 8 * 1024 * 1024 * 1024,
  getUsedMemory: () => Promise.resolve(0),
};

declare global {
  // eslint-disable-next-line no-var -- globalThis property declaration requires var
  var __mockDeviceInfo: MockDeviceInfo | undefined;
}

export function __setMockDeviceInfo(info: MockDeviceInfo): void {
  globalThis.__mockDeviceInfo = info;
}

export function __resetMockDeviceInfo(): void {
  globalThis.__mockDeviceInfo = undefined;
}

// SAFETY: the Proxy target is never read directly - every access goes through the get trap below.
const nativeInterface = new Proxy({} as MockDeviceInfo, {
  get(_target, prop: string) {
    const current = globalThis.__mockDeviceInfo ?? DEFAULT_DEVICE_INFO;
    // SAFETY: prop is one of the keys accessed by real react-native-device-info consumers, all declared on MockDeviceInfo.
    return current[prop as keyof MockDeviceInfo];
  },
});

export default nativeInterface;

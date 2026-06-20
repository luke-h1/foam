import DeviceInfo from 'react-native-device-info';

export type DeviceTier = 'low' | 'high';

let cached: DeviceTier | null = null;

export function getDeviceTier(): DeviceTier {
  if (cached !== null) {
    return cached;
  }
  let tier: DeviceTier = 'high';
  try {
    const isLowRam = DeviceInfo.isLowRamDevice?.() === true;
    const totalMemory = DeviceInfo.getTotalMemorySync?.() ?? 0;
    if (
      isLowRam ||
      // 3GB in bytes
      (totalMemory > 0 && totalMemory < 3 * 1024 * 1024 * 1024)
    ) {
      tier = 'low';
    }
  } catch {
    tier = 'high';
  }
  cached = tier;
  return tier;
}

export function isLowEndDevice(): boolean {
  return getDeviceTier() === 'low';
}

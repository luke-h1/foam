import DeviceInfo from 'react-native-device-info';

export type DeviceTier = 'low' | 'high';

const LOW_RAM_THRESHOLD_BYTES = 3 * 1024 * 1024 * 1024; // 3GB

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
      (totalMemory > 0 && totalMemory < LOW_RAM_THRESHOLD_BYTES)
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

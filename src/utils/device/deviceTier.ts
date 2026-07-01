import DeviceInfo from 'react-native-device-info';

export type DeviceTier = 'low' | 'high';

let cached: DeviceTier | null = null;
let cachedTotalMemoryBytes: number | null = null;

/**
 * Total physical RAM of the device in bytes (0 when unavailable, e.g. web or a
 * failed native call). Cached after the first read since it never changes for
 * the process. Used to scale image-memory budgets to the device instead of
 * hard-coding a single ceiling for every phone.
 */
export function getTotalDeviceMemoryBytes(): number {
  if (cachedTotalMemoryBytes !== null) {
    return cachedTotalMemoryBytes;
  }
  let total = 0;
  try {
    total = DeviceInfo.getTotalMemorySync?.() ?? 0;
  } catch {
    total = 0;
  }
  cachedTotalMemoryBytes = total;
  return total;
}

export function getDeviceTier(): DeviceTier {
  if (cached !== null) {
    return cached;
  }
  let tier: DeviceTier = 'high';
  try {
    const isLowRam = DeviceInfo.isLowRamDevice?.() === true;
    const totalMemory = getTotalDeviceMemoryBytes();
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

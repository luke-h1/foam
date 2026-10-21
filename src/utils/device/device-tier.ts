import DeviceInfo from 'react-native-device-info/src/internal/nativeInterface';

export type DeviceTier = 'low' | 'high';

const THREE_GB = 3 * 1024 * 1024 * 1024;

let cached: DeviceTier | null = null;
let cachedTotalMemoryBytes: number | null = null;

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

  // Bridgeless can leave sync getters undefined; treat non-positive as unknown.
  if (!Number.isFinite(total) || total <= 0) {
    total = 0;
  }

  cachedTotalMemoryBytes = total;
  return total;
}

/**
 * Prefer `low` when RAM is unknown so emote decode budgets stay on the low
 * ceiling instead of the high-tier 600MB path.
 */
export function getDeviceTier(): DeviceTier {
  if (cached !== null) {
    return cached;
  }

  let tier: DeviceTier = 'low';

  try {
    const isLowRam = DeviceInfo.isLowRamDevice === true;
    const totalMemory = getTotalDeviceMemoryBytes();

    if (!isLowRam && totalMemory >= THREE_GB) {
      tier = 'high';
    }
  } catch {
    tier = 'low';
  }

  cached = tier;
  return tier;
}

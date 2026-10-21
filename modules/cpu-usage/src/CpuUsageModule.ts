import { requireOptionalNativeModule } from 'expo-modules-core';
import type { CpuUsageNativeModule } from './CpuUsage.types';

const native = requireOptionalNativeModule<CpuUsageNativeModule>('CpuUsage');

const cpuUsageModule: CpuUsageNativeModule = {
  getUsage() {
    return native?.getUsage?.() ?? 0;
  },
  getUsedMemoryMb() {
    return native?.getUsedMemoryMb?.() ?? 0;
  },
};

export default cpuUsageModule;

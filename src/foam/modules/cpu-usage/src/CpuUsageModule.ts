import { requireOptionalNativeModule } from 'expo-modules-core';
import type { CpuUsageNativeModule } from './CpuUsage.types';

const unavailableModule: CpuUsageNativeModule = {
  getUsage() {
    return 0;
  },
};

export default requireOptionalNativeModule<CpuUsageNativeModule>('CpuUsage') ??
  unavailableModule;

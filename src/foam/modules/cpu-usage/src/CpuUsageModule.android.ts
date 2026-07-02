import type { CpuUsageNativeModule } from './CpuUsage.types';

// iOS-only dev benchmark helper; Android reports 0.
const unavailableModule: CpuUsageNativeModule = {
  getUsage() {
    return 0;
  },
};

export default unavailableModule;

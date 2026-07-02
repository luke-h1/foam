import type { ImageMemoryPressureNativeModule } from './ImageMemoryPressure.types';

// iOS-only pre-jetsam headroom probe (os_proc_available_memory). Android's
// memory model differs (onTrimMemory callbacks); report 0 so the JS monitor
// stays disabled and Coil's bounded cache handles pressure instead.
const unavailableModule: ImageMemoryPressureNativeModule = {
  getAvailableMemory() {
    return 0;
  },
};

export default unavailableModule;

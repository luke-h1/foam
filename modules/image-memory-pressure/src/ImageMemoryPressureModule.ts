import { requireOptionalNativeModule } from 'expo-modules-core';

import type { ImageMemoryPressureNativeModule } from './ImageMemoryPressure.types';

const unavailableModule: ImageMemoryPressureNativeModule = {
  getAvailableMemory() {
    return 0;
  },
};

export default requireOptionalNativeModule<ImageMemoryPressureNativeModule>(
  'ImageMemoryPressure',
) ?? unavailableModule;

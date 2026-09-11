import { requireOptionalNativeModule } from 'expo-modules-core';

import type { FullyDrawnNativeModule } from './FullyDrawn.types';

const unavailableModule: FullyDrawnNativeModule = {
  report() {},
};

export default requireOptionalNativeModule<FullyDrawnNativeModule>(
  'FullyDrawn',
) ?? unavailableModule;

import { requireOptionalNativeModule } from 'expo-modules-core';

import type { SignpostNativeModule } from './Signpost.types';

const unavailableModule: SignpostNativeModule = {
  mark() {},
  begin() {},
  end() {},
};

export default requireOptionalNativeModule<SignpostNativeModule>('Signpost') ??
  unavailableModule;

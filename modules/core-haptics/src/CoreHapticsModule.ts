import { requireNativeModule } from 'expo';
import { NativeCoreHapticsModule } from './CoreHaptics.types';

// This call loads the native module object from the JSI
export default requireNativeModule<NativeCoreHapticsModule>(
  'NativeCoreHaptics',
);

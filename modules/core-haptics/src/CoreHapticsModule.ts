import { requireNativeModule } from 'expo';
import { CoreHapticsModule } from './CoreHaptics.types';

// This call loads the native module object from the JSI
export default requireNativeModule<CoreHapticsModule>('CoreHaptics');

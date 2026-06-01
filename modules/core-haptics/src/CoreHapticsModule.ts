import * as Haptics from 'expo-haptics';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type {
  HapticPatternData,
  NativeCoreHapticsModule,
} from './CoreHaptics.types';

const fallbackModule: NativeCoreHapticsModule = {
  async impact(_sharpness: number, _intensity: number): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },
  async playPattern(_patternData: HapticPatternData): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },
};

export default requireOptionalNativeModule<NativeCoreHapticsModule>(
  'NativeCoreHaptics',
) ?? fallbackModule;

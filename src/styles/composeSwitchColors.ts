import type { SwitchColors } from '@expo/ui/jetpack-compose';

import type { ColorScheme } from '@app/styles/themes';

/**
 * Compose switch colors pinned to the iOS system switch per scheme - no
 * Material You/dynamic color (Android must match iOS).
 */
export const iosMatchedSwitchColors: Record<ColorScheme, SwitchColors> = {
  light: {
    checkedThumbColor: '#FFFFFF',
    checkedTrackColor: '#34C759',
    uncheckedThumbColor: '#FFFFFF',
    uncheckedTrackColor: '#E9E9EB',
  },
  dark: {
    checkedThumbColor: '#FFFFFF',
    checkedTrackColor: '#30D158',
    uncheckedThumbColor: '#FFFFFF',
    uncheckedTrackColor: '#39393D',
  },
};

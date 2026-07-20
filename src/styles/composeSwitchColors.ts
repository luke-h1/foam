import type { SwitchColors } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

/**
 * Pins the Jetpack Compose Switch to the colours the iOS native UISwitch shows
 * in dark mode, so toggles read identically on both platforms instead of
 * picking up the device's Material You palette. The track colours are Apple's
 * UISwitch dark-palette values, which have no theme token.
 */
export const iosMatchedSwitchColors: SwitchColors = {
  checkedThumbColor: theme.color.onAccent.dark,
  checkedTrackColor: '#30D158',
  uncheckedThumbColor: theme.color.onAccent.dark,
  uncheckedTrackColor: '#39393D',
};

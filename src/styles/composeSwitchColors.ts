import type { SwitchColors } from '@expo/ui/jetpack-compose';

/**
 * Pins the Jetpack Compose Switch to the colours the iOS native UISwitch shows
 * in dark mode, so toggles read identically on both platforms instead of
 * picking up the device's Material You palette.
 */
export const iosMatchedSwitchColors: SwitchColors = {
  checkedThumbColor: '#FFFFFF',
  checkedTrackColor: '#30D158',
  uncheckedThumbColor: '#FFFFFF',
  uncheckedTrackColor: '#39393D',
};

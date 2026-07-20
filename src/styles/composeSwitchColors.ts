import type { SwitchColors } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

export const iosMatchedSwitchColors: SwitchColors = {
  checkedThumbColor: theme.color.onAccent.dark,
  checkedTrackColor: '#30D158',
  uncheckedThumbColor: theme.color.onAccent.dark,
  uncheckedTrackColor: '#39393D',
};

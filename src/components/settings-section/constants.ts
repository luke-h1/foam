import type { ListItemColors } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

export const listItemColors = {
  containerColor: theme.color.surfaceNeutral.dark,
  contentColor: theme.color.text.dark,
} satisfies ListItemColors;

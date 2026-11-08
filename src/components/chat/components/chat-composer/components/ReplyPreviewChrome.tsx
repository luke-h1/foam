import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { theme } from '@app/styles/themes';

export function ReplyPreviewChrome({ children }: { children: ReactNode }) {
  return <View style={styles.shell}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});

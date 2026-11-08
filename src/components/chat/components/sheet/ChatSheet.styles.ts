import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

export const chatSheetStyles = StyleSheet.create({
  /**
   * The container of a list sheet that fills its fraction detent.
   */
  listContainer: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
  },
  /**
   * No gap: each `SettingsSection` carries its own bottom margin.
   */
  scrollContent: {
    paddingBottom: theme.space16,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space20,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
});

import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

export const styles = StyleSheet.create({
  connectingContainer: {
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  connectingText: {
    color: theme.colorGrey,
    fontSize: theme.fontSize14,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginHorizontal: theme.space12,
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  emptyStateBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    marginTop: theme.space8,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fontSize14,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.space8,
    paddingTop: 0,
  },
  listGestureWrapper: {
    flex: 1,
  },
  messagePane: {
    flex: 1,
  },
});

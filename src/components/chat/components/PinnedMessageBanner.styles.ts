import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

export const styles = StyleSheet.create({
  pinnedIconShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(145,91,255,0.28)',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pinnedMessageActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pinnedMessageActions: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  pinnedMessageBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,34,38,0.96)',
    borderBottomColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  pinnedMessageContent: {
    flex: 1,
    minWidth: 0,
  },
  pinnedMessageText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  pinnedMessageTitle: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    lineHeight: 16,
  },
});

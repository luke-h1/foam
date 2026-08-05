import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

export const subscriptionNoticeStyles = StyleSheet.create({
  descriptionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 0,
  },
  descriptionText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: 15,
  },
  emote: {
    height: 24,
    marginHorizontal: 2,
    width: 24,
  },
  headerLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  monthsHighlight: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    lineHeight: 15,
  },
  recipientName: {
    color: theme.colorViolet,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  username: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    lineHeight: 15,
    marginRight: theme.space4,
  },
});

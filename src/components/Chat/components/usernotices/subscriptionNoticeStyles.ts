import { StyleSheet } from 'react-native';

import { type ColorScheme, theme } from '@app/styles/themes';

const createSubscriptionNoticeStyles = (scheme: ColorScheme) =>
  StyleSheet.create({
    descriptionContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      flex: 1,
      minWidth: 0,
    },
    descriptionText: {
      color: theme.color.textSecondary[scheme],
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
      color: theme.color.textSecondary[scheme],
      fontSize: theme.fontSize12,
      fontStyle: 'italic',
      lineHeight: 15,
    },
    monthsHighlight: {
      color: theme.color.text[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '700',
      lineHeight: 15,
    },
    recipientName: {
      color: theme.color.violet[scheme],
      fontSize: theme.fontSize14,
      fontWeight: '600',
    },
    username: {
      color: theme.color.text[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '700',
      lineHeight: 15,
      marginRight: theme.space4,
    },
  });

export const subscriptionNoticeStyles = {
  light: createSubscriptionNoticeStyles('light'),
  dark: createSubscriptionNoticeStyles('dark'),
} as const;

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import type { ChatRowState } from '@app/components/chat/components/chat-message/ChatRow.types';
import { noticeSurfaceTint } from '@app/components/chat/util/chatNoticeAccents';

import { styles } from './ChatRow.styles';
import { getChatTextStyles } from './ChatText.styles';

const variantStyleCache = new Map<string, ViewStyle | undefined>();

const MAX_VARIANT_STYLE_CACHE = 256;

function buildVariantStyle(
  state: ChatRowState,
  ownMention: boolean,
  customColor: string,
): ViewStyle | undefined {
  const {
    announcementAccentColor,
    bodyVariant,
    density,
    isAlternatingRow,
    isAppSystemSender,
    isChannelPointRedemption,
    isFirstMessage,
    isHighlightedMessage,
    isHighlightedMessageTarget,
    isHighlightedSender,
    isReturningChatter,
    isUserChat,
    tokenRenderProps,
  } = state;

  const textStyles = getChatTextStyles(tokenRenderProps.fontScale, density);

  const surface = (colour: StyleProp<ViewStyle>) => [
    textStyles.surface,
    colour,
  ];

  const active = [
    isAlternatingRow && styles.alternatingRowContainer,
    isAppSystemSender && styles.systemMessageContainer,
    isUserChat &&
      isHighlightedMessageTarget && [
        styles.highlightedReplyTargetContainer,
        textStyles.highlightInset,
      ],
    isUserChat &&
      isHighlightedSender && [
        styles.highlightedSenderContainer,
        textStyles.highlightInset,
      ],
    ownMention && [styles.ownMentionContainer, textStyles.accentInset],
    bodyVariant === 'viewer_milestone' &&
      surface(styles.viewerMilestoneContainer),
    bodyVariant === 'mod_anniversary' && surface(styles.modAnniversarySurface),
    bodyVariant === 'subscription' && surface(styles.subscriptionNoticeSurface),
    bodyVariant === 'charity_donation' &&
      surface(styles.charityDonationSurface),
    bodyVariant === 'ritual' && surface(styles.ritualNoticeSurface),
    bodyVariant === 'raid' && surface(styles.raidNoticeSurface),
    bodyVariant === 'announcement' &&
      surface([
        styles.announcementContainer,
        announcementAccentColor
          ? {
              backgroundColor: noticeSurfaceTint(announcementAccentColor),
              borderLeftColor: announcementAccentColor,
            }
          : null,
      ]),
    isUserChat && isFirstMessage && surface(styles.firstMessageNoticeSurface),
    isUserChat &&
      isReturningChatter &&
      surface(styles.returningChatterNoticeSurface),
    customColor !== '' &&
      surface({
        backgroundColor: noticeSurfaceTint(customColor, 0.1),
        borderLeftColor: customColor,
      }),
    isUserChat &&
      isHighlightedMessage &&
      surface(styles.highlightMyMessageContainer),
    isChannelPointRedemption &&
      isUserChat &&
      !isHighlightedMessage &&
      surface(styles.rewardMessageContainer),
  ];

  const hasOverride = active.some(Boolean);
  return hasOverride ? (StyleSheet.flatten(active) ?? undefined) : undefined;
}

function getChatRowSurfaceStyle(state: ChatRowState) {
  const {
    announcementAccentColor,
    bodyVariant,
    customHighlightColor,
    density,
    isAlternatingRow,
    isAppSystemSender,
    isChannelPointRedemption,
    isFirstMessage,
    isHighlightedMessage,
    isHighlightedMessageTarget,
    isHighlightedSender,
    isReturningChatter,
    isUserChat,
    mentionsCurrentUser,
    style,
    tokenRenderProps,
  } = state;

  const ownMention = isUserChat && mentionsCurrentUser;

  const customColor =
    (isUserChat && !mentionsCurrentUser && customHighlightColor) || '';

  const accent =
    bodyVariant === 'announcement' ? (announcementAccentColor ?? '') : '';

  const key = `${tokenRenderProps.fontScale ?? 'default'}|${density}|${bodyVariant ?? ''}|${accent}|${customColor}|${+isAlternatingRow}${+isAppSystemSender}${+isUserChat}${+(isUserChat && isHighlightedMessageTarget)}${+(isUserChat && isHighlightedSender)}${+ownMention}${+(isUserChat && isFirstMessage)}${+(isUserChat && isReturningChatter)}${+(isUserChat && isHighlightedMessage)}${+isChannelPointRedemption}`;

  let variantStyle = variantStyleCache.get(key);

  if (variantStyle === undefined && !variantStyleCache.has(key)) {
    variantStyle = buildAndCacheVariantStyle(
      key,
      state,
      ownMention,
      customColor,
    );
  }

  return [styles.chatContainer, style, variantStyle];
}

function buildAndCacheVariantStyle(
  key: string,
  state: ChatRowState,
  ownMention: boolean,
  customColor: string,
) {
  if (variantStyleCache.size >= MAX_VARIANT_STYLE_CACHE) {
    variantStyleCache.clear();
  }

  const variantStyle = buildVariantStyle(state, ownMention, customColor);
  variantStyleCache.set(key, variantStyle);
  return variantStyle;
}

export function ChatRowSurface({
  state,
  children,
}: {
  state: ChatRowState;
  children: ReactNode;
}) {
  const { clearRowLongPressTimer, handleRowTouchMove, startRowLongPressTimer } =
    state;

  return (
    <View
      testID='chat-message'
      onTouchCancel={clearRowLongPressTimer}
      onTouchEnd={clearRowLongPressTimer}
      onTouchMove={handleRowTouchMove}
      onTouchStart={startRowLongPressTimer}
      style={getChatRowSurfaceStyle(state)}
    >
      {children}
    </View>
  );
}

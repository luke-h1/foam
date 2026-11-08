import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SubscriptionNoticeTokenType } from '@app/utils/chat/subscription-notice-token-types';

import { styles as chatStyles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import { NoticeUserMessage } from './NoticeUserMessage';
import { buildSubscriptionNoticeDescription } from './util/buildSubscriptionNoticeDescription';

interface SubscriptionNoticeProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  messageTokens: MessageToken[];
  token: MessageToken<SubscriptionNoticeTokenType>;
}

/**
 * Twitch's usernotice payload is a union: each subscription kind carries a
 * different subset of these fields, so each is read only when present.
 */
function pickSubscriptionDescriptionFields(
  subscriptionEvent: SubscriptionNoticeProps['token']['subscriptionEvent'],
) {
  return {
    cumulativeMonths:
      'months' in subscriptionEvent ? subscriptionEvent.months : undefined,
    streakMonths:
      'streakMonths' in subscriptionEvent
        ? subscriptionEvent.streakMonths
        : undefined,
    shouldShareStreak:
      'shouldShareStreak' in subscriptionEvent
        ? subscriptionEvent.shouldShareStreak
        : undefined,
    giftMonths:
      'giftMonths' in subscriptionEvent
        ? subscriptionEvent.giftMonths
        : undefined,
    recipientDisplayName:
      'recipientDisplayName' in subscriptionEvent
        ? subscriptionEvent.recipientDisplayName
        : undefined,
    promoName:
      'promoName' in subscriptionEvent
        ? subscriptionEvent.promoName
        : undefined,
    promoGiftTotal:
      'promoGiftTotal' in subscriptionEvent
        ? Number(subscriptionEvent.promoGiftTotal) || undefined
        : undefined,
    massGiftCount:
      'massGiftCount' in subscriptionEvent
        ? subscriptionEvent.massGiftCount
        : undefined,
    senderCount:
      'senderCount' in subscriptionEvent
        ? subscriptionEvent.senderCount
        : undefined,
    senderName:
      'senderName' in subscriptionEvent
        ? subscriptionEvent.senderName
        : undefined,
  };
}

/**
 * `createSubscriptionToken` maps `msg-param-sub-plan` to `planName`. A notice
 * with no plan (an upgrade, an unknown code) reads as Tier 1.
 */
function getTierDisplay(
  subscriptionEvent: SubscriptionNoticeProps['token']['subscriptionEvent'],
): string {
  return (
    ('planName' in subscriptionEvent
      ? subscriptionEvent.planName
      : undefined) ?? 'Tier 1'
  );
}

function SubscriptionNoticeComponent({
  density,
  disableEmoteAnimations,
  fontScale,
  messageTokens,
  token,
}: SubscriptionNoticeProps) {
  const { subscriptionEvent } = token;
  const textStyles = getChatTextStyles(fontScale, density);
  const tierDisplay = getTierDisplay(subscriptionEvent);

  const description = buildSubscriptionNoticeDescription({
    ...pickSubscriptionDescriptionFields(subscriptionEvent),
    isPrime: tierDisplay === 'Prime',
    msgId: subscriptionEvent.msgId,
    styles: {
      descriptionText: textStyles.meta,
      emphasis: [textStyles.meta, textStyles.metaStrong, styles.emphasis],
      name: [textStyles.body, styles.name],
    },
    tierDisplay,
  });

  return (
    <View style={[chatStyles.subscriptionNoticeColumn, textStyles.stackGap]}>
      <ChatNoticeMetaRow
        icon='star.fill'
        {...{
          density,
          fontScale,
          labelColor: CHAT_NOTICE_ACCENTS.subscription,
        }}
      >
        <View style={styles.descriptionContainer}>
          <ChatText
            style={[
              textStyles.meta,
              textStyles.metaStrong,
              textStyles.iconSpacing,
              styles.emphasis,
            ]}
          >
            {subscriptionEvent.displayName}
          </ChatText>
          {description}
        </View>
      </ChatNoticeMetaRow>
      <NoticeUserMessage
        {...{
          density,
          disableEmoteAnimations,
          fontScale,
          tokens: messageTokens,
        }}
      />
    </View>
  );
}

export const SubscriptionNotice = memo(SubscriptionNoticeComponent);

const styles = StyleSheet.create({
  descriptionContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    minWidth: 0,
  },
  emphasis: {
    color: theme.color.text.dark,
  },
  name: {
    color: theme.colorViolet,
    fontWeight: '600',
  },
});

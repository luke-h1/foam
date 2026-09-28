import { memo } from 'react';
import { View } from 'react-native';

import { getSubscriptionTierDisplay } from '@app/components/chat/components/user-notices/util/subscription-notice-tier';
import { Image } from '@app/components/image/image';
import { Text } from '@app/components/ui/text/text';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { MessageToken } from '@app/utils/chat/message-token';

import { styles as chatStyles } from '../chat-message/chat-row.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { buildSubscriptionNoticeDescription } from './build-subscription-notice-description';
import { subscriptionNoticeStyles as styles } from './subscription-notice.styles';

function getMessagePartKey(token: MessageToken, occurrence: number): string {
  switch (token.type) {
    case 'emote':
      return `emote:${token.url ?? token.content}:${occurrence}`;
    case 'text':
      return `text:${token.content}:${occurrence}`;
    default:
      return `${token.type}:${occurrence}`;
  }
}

function renderMessagePart(messagePart: MessageToken, occurrence: number) {
  const key = getMessagePartKey(messagePart, occurrence);

  switch (messagePart.type) {
    case 'text':
      return (
        <Text key={key} style={styles.messageText}>
          {messagePart.content}
        </Text>
      );
    case 'emote':
      return (
        <Image
          key={key}
          trackLoadContext='chat.subscription-notice-emote'
          source={messagePart.url}
          cacheVariant='emote'
          style={styles.emote}
          transition={0}
        />
      );
    default:
      return null;
  }
}

interface SubscriptionNoticeProps {
  token: MessageToken<
    | 'sub'
    | 'resub'
    | 'anongiftpaidupgrade'
    | 'anongift'
    | 'submysterygift'
    | 'giftpaidupgrade'
    | 'primepaidupgrade'
  >;
  notice_tags?: UserNoticeTags;
  parsedMessage?: MessageToken[];
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
 * Renders the chatter's own message under the notice. Token keys repeat within
 * one message, so each is suffixed by how many times it has been seen.
 */
function renderParsedMessageParts(
  parsedMessage: SubscriptionNoticeProps['parsedMessage'],
) {
  if (!parsedMessage || parsedMessage.length === 0) {
    return null;
  }

  const partKeyCounts = new Map<string, number>();

  return parsedMessage.map(partItem => {
    const baseKey = getMessagePartKey(partItem, 0).replace(/:\d+$/, '');
    const occurrence = partKeyCounts.get(baseKey) ?? 0;
    partKeyCounts.set(baseKey, occurrence + 1);
    return renderMessagePart(partItem, occurrence);
  });
}

interface SubscriptionNoticeMessageProps {
  message: string | undefined;
  renderedParsedMessageParts: ReturnType<typeof renderParsedMessageParts>;
}

function SubscriptionNoticeMessage({
  message,
  renderedParsedMessageParts,
}: SubscriptionNoticeMessageProps) {
  if (renderedParsedMessageParts) {
    return renderedParsedMessageParts;
  }

  if (message) {
    return <Text style={styles.messageText}>{message.trim()}</Text>;
  }

  return null;
}

function SubscriptionNoticeComponent({
  token,
  parsedMessage,
}: SubscriptionNoticeProps) {
  const { subscriptionEvent } = token;
  const { msgId, displayName, message } = subscriptionEvent;

  const tierDisplay = getSubscriptionTierDisplay({
    plan: 'plan' in subscriptionEvent ? subscriptionEvent.plan : undefined,
    planName:
      'planName' in subscriptionEvent ? subscriptionEvent.planName : undefined,
  });

  const isPrime = tierDisplay === 'Prime';

  const description = buildSubscriptionNoticeDescription({
    ...pickSubscriptionDescriptionFields(subscriptionEvent),
    isPrime,
    msgId,
    tierDisplay,
  });

  const renderedParsedMessageParts = renderParsedMessageParts(parsedMessage);

  return (
    <View style={chatStyles.subscriptionNoticeColumn}>
      <ChatNoticeMetaRow
        icon='star.fill'
        labelColor={CHAT_NOTICE_ACCENTS.subscription}
      >
        <View style={styles.descriptionContainer}>
          <Text style={styles.username}>{displayName}</Text>
          {description}
        </View>
      </ChatNoticeMetaRow>
      {(parsedMessage && parsedMessage.length > 0) || message ? (
        <View style={styles.messageContainer}>
          <SubscriptionNoticeMessage
            message={message}
            renderedParsedMessageParts={renderedParsedMessageParts}
          />
        </View>
      ) : null}
    </View>
  );
}

export const SubscriptionNotice = memo(SubscriptionNoticeComponent);

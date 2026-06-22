import { memo } from 'react';
import { View } from 'react-native';

import { getSubscriptionTierDisplay } from '@app/components/Chat/components/usernotices/util/subscriptionNoticeTier';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles as chatStyles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { buildSubscriptionNoticeDescription } from './buildSubscriptionNoticeDescription';
import { subscriptionNoticeStyles as styles } from './subscriptionNoticeStyles';

function getMessagePartKey(part: ParsedPart, occurrence: number): string {
  switch (part.type) {
    case 'emote':
      return `emote:${part.url ?? part.content}:${occurrence}`;
    case 'text':
      return `text:${part.content}:${occurrence}`;
    default:
      return `${part.type}:${occurrence}`;
  }
}

function renderMessagePart(messagePart: ParsedPart, occurrence: number) {
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
  part: ParsedPart<
    | 'sub'
    | 'resub'
    | 'anongiftpaidupgrade'
    | 'anongift'
    | 'submysterygift'
    | 'giftpaidupgrade'
    | 'primepaidupgrade'
  >;
  notice_tags?: UserNoticeTags;
  parsedMessage?: ParsedPart[];
}

function SubscriptionNoticeComponent({
  part,
  parsedMessage,
}: SubscriptionNoticeProps) {
  const { subscriptionEvent } = part;
  const { msgId, displayName, message } = subscriptionEvent;
  const tierDisplay = getSubscriptionTierDisplay({
    plan: 'plan' in subscriptionEvent ? subscriptionEvent.plan : undefined,
    planName:
      'planName' in subscriptionEvent ? subscriptionEvent.planName : undefined,
  });
  const isPrime = tierDisplay === 'Prime';

  const description = buildSubscriptionNoticeDescription({
    msgId,
    isPrime,
    tierDisplay,
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
  });

  const renderedParsedMessageParts =
    parsedMessage && parsedMessage.length > 0
      ? (() => {
          const partKeyCounts = new Map<string, number>();
          return parsedMessage.map(partItem => {
            const baseKey = getMessagePartKey(partItem, 0).replace(/:\d+$/, '');
            const occurrence = partKeyCounts.get(baseKey) ?? 0;
            partKeyCounts.set(baseKey, occurrence + 1);
            return renderMessagePart(partItem, occurrence);
          });
        })()
      : null;

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
          {renderedParsedMessageParts ? (
            renderedParsedMessageParts
          ) : message ? (
            <Text style={styles.messageText}>{message.trim()}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const SubscriptionNotice = memo(SubscriptionNoticeComponent);

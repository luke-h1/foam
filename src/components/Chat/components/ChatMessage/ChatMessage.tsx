import { Text } from '@app/components/Text/Text';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatMessageType } from '@app/store/chatStore';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { memo, ReactNode, useMemo } from 'react';
import { View, StyleSheet as RNStyleSheet } from 'react-native';
import { NitroImage } from 'react-native-nitro-image';

const EMOTE_TARGET_HEIGHT = 30;

const emoteStyleCache = new Map<
  string,
  { width: number; height: number; marginHorizontal: number }
>();

function getEmoteStyle(
  originalWidth: number,
  originalHeight: number,
): { width: number; height: number; marginHorizontal: number } {
  const cacheKey = `${originalWidth}_${originalHeight}`;
  const cached = emoteStyleCache.get(cacheKey);
  if (cached) return cached;

  const aspectRatio = originalWidth / originalHeight;
  const result = {
    width: EMOTE_TARGET_HEIGHT * aspectRatio,
    height: EMOTE_TARGET_HEIGHT,
    marginHorizontal: 2,
  };

  emoteStyleCache.set(cacheKey, result);

  if (emoteStyleCache.size > 100) {
    const firstKey = emoteStyleCache.keys().next().value as string | undefined;
    if (firstKey) emoteStyleCache.delete(firstKey);
  }

  return result;
}

const usernameStyleCache = new Map<
  string,
  { fontWeight: '600'; marginRight: number; color?: string }
>();

function getUsernameStyle(color: string | undefined): {
  fontWeight: '600';
  marginRight: number;
  color?: string;
} {
  const cacheKey = color || '_default';
  const cached = usernameStyleCache.get(cacheKey);
  if (cached) return cached;

  const result = color
    ? { fontWeight: '600' as const, marginRight: 5, color }
    : { fontWeight: '600' as const, marginRight: 5 };

  usernameStyleCache.set(cacheKey, result);

  if (usernameStyleCache.size > 200) {
    const firstKey = usernameStyleCache.keys().next().value as
      | string
      | undefined;
    if (firstKey) usernameStyleCache.delete(firstKey);
  }

  return result;
}

export interface ChatMessageProps {
  /* eslint-disable-next-line react/no-unused-prop-types -- used by parent for keys */
  messageId: string;
  sender: string;
  senderColor: string | undefined;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  isReply?: boolean;
  parentDisplayName?: string;
}

const styles = RNStyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  badge: {
    width: 20,
    height: 20,
    marginRight: 2,
  },
  text: {
    color: '#EFEFF1',
    fontSize: 14,
    lineHeight: 30,
  },
  mention: {
    fontWeight: '500',
  },
  replyIndicator: {
    flexDirection: 'row',
    marginBottom: 2,
    opacity: 0.6,
  },
  replyText: {
    fontSize: 11,
    color: '#ADADB8',
  },
});

function renderPart(part: ParsedPart, index: number): ReactNode {
  switch (part.type) {
    case 'text':
      return (
        <Text key={index} style={styles.text}>
          {part.content}
        </Text>
      );
    case 'emote': {
      if (!part.url) return null;
      const emoteStyle = getEmoteStyle(part.width || 20, part.height || 20);
      return (
        <NitroImage
          key={index}
          image={{ url: part.url }}
          style={emoteStyle}
          resizeMode="contain"
          recyclingKey={part.url}
        />
      );
    }
    case 'mention':
      return (
        <Text key={index} style={[styles.text, styles.mention]}>
          {part.content}
        </Text>
      );
    default:
      return null;
  }
}

function ChatMessageComponent({
  sender,
  senderColor,
  message,
  badges,
  isReply,
  parentDisplayName,
}: ChatMessageProps) {
  const renderedParts = useMemo(() => message.map(renderPart), [message]);

  const renderedBadges = useMemo(
    () =>
      badges.map(badge => (
        <NitroImage
          key={badge.url}
          image={{ url: badge.url }}
          style={styles.badge}
          resizeMode="contain"
          recyclingKey={badge.url}
        />
      )),
    [badges],
  );

  const usernameStyle = getUsernameStyle(senderColor);

  return (
    <View style={styles.container}>
      {isReply && parentDisplayName && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyText}>↳ @{parentDisplayName} </Text>
        </View>
      )}

      {renderedBadges}

      <Text style={usernameStyle}>{sender}:</Text>

      {renderedParts}
    </View>
  );
}

function areEqual(prev: ChatMessageProps, next: ChatMessageProps): boolean {
  return (
    prev.messageId === next.messageId &&
    prev.sender === next.sender &&
    prev.senderColor === next.senderColor &&
    prev.message === next.message &&
    prev.badges === next.badges &&
    prev.isReply === next.isReply &&
    prev.parentDisplayName === next.parentDisplayName
  );
}

export const ChatMessage = memo(ChatMessageComponent, areEqual);
ChatMessage.displayName = 'ChatMessage';

export function toChatMessageProps<T extends NoticeVariants>(
  msg: ChatMessageType<T>,
  lightenedColor?: string,
): ChatMessageProps {
  return {
    messageId: msg.message_id,
    sender: msg.sender,
    senderColor: lightenedColor || msg.userstate.color,
    message: msg.message,
    badges: msg.badges,
    isReply: Boolean(msg.parentDisplayName),
    parentDisplayName: msg.parentDisplayName,
  };
}

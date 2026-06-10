import { Text } from '@app/components/ui/Text/Text';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { formatMentionContent } from '@app/utils/chat/resolveMentionLogin';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { styles } from '../RichChatMessage.styles';
import { normaliseUsername } from '../richChatMessageHelpers';
import type { BadgePressData } from '../RichChatMessage.types';
import { ChatMessageBadges } from './ChatMessageBadges';
import { EmoteRenderer } from './EmoteRenderer';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

export type InlineFlowPart = ParsedPart<'text' | 'mention' | 'link' | 'emote'>;

/**
 * True when every part can live inside a single Text element, which lets
 * the body wrap inline after the username (like Twitch web) instead of
 * dropping to a rectangular block on the next flex line.
 */
export function canRenderMessageInline(
  message: ParsedPart[],
  options: { hasPaint: boolean; isModerated: boolean },
): message is InlineFlowPart[] {
  if (options.hasPaint || options.isModerated) {
    return false;
  }

  return message.every(
    part =>
      part.type === 'text' ||
      part.type === 'mention' ||
      part.type === 'link' ||
      (part.type === 'emote' && !part.zero_width),
  );
}

type InlineSpanOptions = Pick<
  UseChatMessagePartRendererArgs,
  | 'compact'
  | 'disableEmoteAnimations'
  | 'effectiveHighlightedUserSet'
  | 'getMentionColor'
  | 'getPartKey'
  | 'handleEmoteLongPress'
  | 'normalisedCurrentUsername'
  | 'replyPlainMentionTarget'
  | 'emoteTargetSize'
> & {
  textStyle?: StyleProp<TextStyle>;
};

export function renderInlineMessageSpans(
  message: InlineFlowPart[],
  options: InlineSpanOptions,
): ReactNode[] {
  const {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    getMentionColor,
    getPartKey,
    handleEmoteLongPress,
    normalisedCurrentUsername,
    replyPlainMentionTarget,
    emoteTargetSize,
    textStyle,
  } = options;
  const baseTextStyle = textStyle ?? [
    styles.messageText,
    compact && styles.messageTextCompact,
  ];
  const spans: ReactNode[] = [];
  let pendingText: string | null = null;
  let pendingTextKey: ReturnType<typeof getPartKey> | null = null;

  const flushPendingText = () => {
    if (pendingText === null || pendingTextKey === null) {
      return;
    }
    spans.push(
      <Text key={pendingTextKey} color='gray.text' style={baseTextStyle}>
        {pendingText}
      </Text>,
    );
    pendingText = null;
    pendingTextKey = null;
  };

  for (let index = 0; index < message.length; index += 1) {
    const part = message[index];
    if (!part) {
      continue;
    }

    if (part.type === 'text') {
      const content = getParsedPartStringContent(part);
      if (pendingText === null) {
        pendingText = content;
        pendingTextKey = getPartKey(part, index);
      } else {
        pendingText += content;
      }
      continue;
    }

    flushPendingText();

    if (part.type === 'emote') {
      spans.push(
        <EmoteRenderer
          disableAnimations={disableEmoteAnimations}
          key={getPartKey(part, index)}
          part={part}
          handleEmoteLongPress={handleEmoteLongPress}
          targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
        />,
      );
      continue;
    }

    const content = getParsedPartStringContent(part);
    if (!content.trim()) {
      continue;
    }

    if (part.type === 'link') {
      spans.push(
        <Text
          key={getPartKey(part, index)}
          style={[styles.messageLink, compact && styles.messageLinkCompact]}
        >
          {content}
        </Text>,
      );
      continue;
    }

    if (part.type === 'mention') {
      const mentionContent = formatMentionContent(content);
      const mentionedUsername = mentionContent.replace(/^@/, '').trim();
      const normalisedMentionedUsername = normaliseUsername(mentionedUsername);
      const isReplyTargetMention = Boolean(
        replyPlainMentionTarget &&
        normalisedMentionedUsername === replyPlainMentionTarget,
      );

      if (isReplyTargetMention) {
        spans.push(
          <Text
            key={getPartKey(part, index)}
            color='gray.text'
            style={baseTextStyle}
          >
            {mentionContent}
          </Text>,
        );
        continue;
      }

      const mentionColor = getMentionColor
        ? getMentionColor(mentionedUsername)
        : generateRandomTwitchColor(mentionedUsername);
      const isHighlightedMention =
        effectiveHighlightedUserSet?.has(normalisedMentionedUsername) ||
        normalisedCurrentUsername === normalisedMentionedUsername;

      spans.push(
        <Text
          key={getPartKey(part, index)}
          style={[
            styles.mention,
            compact && styles.mentionCompact,
            isHighlightedMention && styles.mentionHighlighted,
            { color: mentionColor },
          ]}
        >
          {mentionContent}
        </Text>,
      );
      continue;
    }
  }

  flushPendingText();

  return spans;
}

interface InlineMessageLineProps extends UseChatMessagePartRendererArgs {
  badgeList: SanitisedBadgeSet[];
  getMappingKey: (id: string, index: number) => string;
  message: InlineFlowPart[];
  onBadgePress?: (badge: BadgePressData) => void;
  onUsernamePress?: () => void;
  showTimestamp: boolean;
  timestamp?: string;
  username?: string;
  usernameColor?: string;
}

export function InlineMessageLine({
  badgeList,
  getMappingKey,
  message,
  onBadgePress,
  onUsernamePress,
  showTimestamp,
  timestamp,
  username,
  usernameColor,
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  handleEmoteLongPress,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
  emoteTargetSize,
}: InlineMessageLineProps): ReactNode {
  const spans = renderInlineMessageSpans(message, {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    getMentionColor,
    getPartKey,
    handleEmoteLongPress,
    normalisedCurrentUsername,
    replyPlainMentionTarget,
    emoteTargetSize,
  });

  return (
    <View style={styles.messageLineInline}>
      <Text style={[styles.messageText, compact && styles.messageTextCompact]}>
        {showTimestamp && timestamp ? (
          <Text
            tabular
            variant='mono'
            weight='bold'
            style={[styles.timestamp, compact && styles.timestampCompact]}
          >
            {`${timestamp} `}
          </Text>
        ) : null}
        <ChatMessageBadges
          badges={badgeList}
          compact={compact}
          getMappingKey={getMappingKey}
          onBadgePress={onBadgePress}
        />
        {username ? (
          <Text
            onPress={onUsernamePress}
            suppressHighlighting
            testID='chat-username-button'
            style={[
              compact ? styles.usernameTextCompact : styles.usernameText,
              usernameColor ? { color: usernameColor } : null,
            ]}
          >
            {`${username}: `}
          </Text>
        ) : null}
        {spans}
      </Text>
    </View>
  );
}

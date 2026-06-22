import { View } from 'react-native';
import type { ReactNode } from 'react';

import type { InlineFlowPart } from '@app/components/Chat/util/canRenderMessageInline';
import { Text } from '@app/components/ui/Text/Text';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

import { getChatFontScaleStyle, styles } from '../RichChatMessage.styles';
import type { BadgePressData } from '../RichChatMessage.types';
import { ChatMessageBadges } from './ChatMessageBadges';
import { InlineMessageSpans } from './InlineMessageSpans';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

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
  fontScale,
  getMentionColor,
  getPartKey,
  onEmoteTouchStart,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
  emoteTargetSize,
}: InlineMessageLineProps): ReactNode {
  const containsEmotes = message.some(part => part.type === 'emote');
  const fontScaleStyle = getChatFontScaleStyle(fontScale, compact);
  // TextKit sizes a wrapped line from the paragraph style carried by its
  // character ranges, and every nested span sets its own (17pt) lineHeight.
  // The taller emote line height must therefore be applied to each nested
  // span, not just the outer Text — otherwise rows whose first span is plain
  // text (no badges) keep the 17pt line and clip the 30pt emote attachment.
  const emoteLineStyle = containsEmotes
    ? compact
      ? styles.messageTextEmoteLineCompact
      : styles.messageTextEmoteLine
    : undefined;

  return (
    <View style={styles.messageLineInline}>
      <Text
        style={[
          styles.messageText,
          compact && styles.messageTextCompact,
          fontScaleStyle,
          emoteLineStyle,
        ]}
      >
        {showTimestamp && timestamp ? (
          <Text
            tabular
            variant='mono'
            weight='bold'
            style={[
              styles.timestamp,
              compact && styles.timestampCompact,
              emoteLineStyle,
            ]}
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
              fontScaleStyle,
              emoteLineStyle,
              usernameColor ? { color: usernameColor } : null,
            ]}
          >
            {`${username}: `}
          </Text>
        ) : null}
        <InlineMessageSpans
          emoteLineStyle={emoteLineStyle}
          compact={compact}
          disableEmoteAnimations={disableEmoteAnimations}
          effectiveHighlightedUserSet={effectiveHighlightedUserSet}
          fontScale={fontScale}
          getMentionColor={getMentionColor}
          getPartKey={getPartKey}
          onEmoteTouchStart={onEmoteTouchStart}
          message={message}
          normalisedCurrentUsername={normalisedCurrentUsername}
          replyPlainMentionTarget={replyPlainMentionTarget}
          emoteTargetSize={emoteTargetSize}
        />
      </Text>
    </View>
  );
}

import { Text } from '@app/components/ui/Text/Text';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { getChatFontScaleStyle, styles } from '../RichChatMessage.styles';
import type { BadgePressData } from '../RichChatMessage.types';
import type { InlineFlowPart } from '@app/components/Chat/util/canRenderMessageInline';
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
  handleEmoteLongPress,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
  emoteTargetSize,
}: InlineMessageLineProps): ReactNode {
  const containsEmotes = message.some(part => part.type === 'emote');
  const fontScaleStyle = getChatFontScaleStyle(fontScale, compact);

  return (
    <View style={styles.messageLineInline}>
      <Text
        style={[
          styles.messageText,
          compact && styles.messageTextCompact,
          fontScaleStyle,
          containsEmotes &&
            (compact
              ? styles.messageTextEmoteLineCompact
              : styles.messageTextEmoteLine),
        ]}
      >
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
              fontScaleStyle,
              usernameColor ? { color: usernameColor } : null,
            ]}
          >
            {`${username}: `}
          </Text>
        ) : null}
        <InlineMessageSpans
          compact={compact}
          disableEmoteAnimations={disableEmoteAnimations}
          effectiveHighlightedUserSet={effectiveHighlightedUserSet}
          fontScale={fontScale}
          getMentionColor={getMentionColor}
          getPartKey={getPartKey}
          handleEmoteLongPress={handleEmoteLongPress}
          message={message}
          normalisedCurrentUsername={normalisedCurrentUsername}
          replyPlainMentionTarget={replyPlainMentionTarget}
          emoteTargetSize={emoteTargetSize}
        />
      </Text>
    </View>
  );
}

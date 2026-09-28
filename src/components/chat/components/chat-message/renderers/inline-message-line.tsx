import { View } from 'react-native';
import type { ReactNode } from 'react';

import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import { Text } from '@app/components/ui/text/text';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import type { InlineFlowPart } from '@app/utils/chat/derive-chat-body/types';

import { getChatTextStyles } from '../chat-text.styles';
import { styles } from '../rich-chat-message.styles';
import type { BadgePressData } from '../rich-chat-message.types';
import { ChatMessageBadges } from './chat-message-badges';
import { InlineMessageSpans } from './inline-message-spans';
import type { ChatMessagePartRendererArgs } from './types/chat-message-part-renderer-args';

interface InlineMessageLineProps extends ChatMessagePartRendererArgs {
  badgeList: SanitisedBadgeSet[];
  isAction?: boolean;
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
  isAction,
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
  textColor,
}: InlineMessageLineProps): ReactNode {
  const containsEmotes = getMessageStructure(message).containsEmotes;
  const textStyles = getChatTextStyles(fontScale, compact);

  // TextKit sizes a wrapped line from its character ranges, so the taller
  // emote line height must apply to each nested span or emotes clip.
  const emoteLineStyle = containsEmotes ? textStyles.bodyEmoteLine : undefined;

  return (
    <View style={styles.messageLineInline}>
      <Text style={[textStyles.body, emoteLineStyle]}>
        {showTimestamp && timestamp ? (
          <Text tabular style={[textStyles.timestamp, emoteLineStyle]}>
            {`${timestamp} `}
          </Text>
        ) : null}
        <ChatMessageBadges
          badges={badgeList}
          compact={compact}
          fontScale={fontScale}
          onBadgePress={onBadgePress}
        />
        {username ? (
          <Text
            onPress={onUsernamePress}
            suppressHighlighting
            testID='chat-username-button'
            style={[
              textStyles.username,
              emoteLineStyle,
              usernameColor ? getChatColorStyle(usernameColor) : null,
            ]}
          >
            {isAction ? `${username} ` : `${username}: `}
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
          textColor={textColor}
        />
      </Text>
    </View>
  );
}

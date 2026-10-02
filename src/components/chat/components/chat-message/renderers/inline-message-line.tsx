import { View } from 'react-native';
import type { ReactNode } from 'react';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';

import { styles } from '../chat-row.styles';
import type { BadgePressData } from '../chat-row.types';
import { getChatTextStyles } from '../chat-text.styles';
import { ChatMessageBadges } from './chat-message-badges';
import { InlineTokens } from './inline-tokens';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

interface InlineMessageLineProps extends ChatTokenRenderProps {
  badgeList: SanitisedBadgeSet[];
  isAction?: boolean;
  message: InlineFlowToken[];
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
  getTokenKey,
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
      <ChatText style={[textStyles.body, emoteLineStyle]}>
        {showTimestamp && timestamp ? (
          <ChatText tabular style={[textStyles.timestamp, emoteLineStyle]}>
            {`${timestamp} `}
          </ChatText>
        ) : null}
        <ChatMessageBadges
          badges={badgeList}
          compact={compact}
          fontScale={fontScale}
          onBadgePress={onBadgePress}
        />
        {username ? (
          <ChatText
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
          </ChatText>
        ) : null}
        <InlineTokens
          emoteLineStyle={emoteLineStyle}
          compact={compact}
          disableEmoteAnimations={disableEmoteAnimations}
          effectiveHighlightedUserSet={effectiveHighlightedUserSet}
          fontScale={fontScale}
          getMentionColor={getMentionColor}
          getTokenKey={getTokenKey}
          onEmoteTouchStart={onEmoteTouchStart}
          message={message}
          normalisedCurrentUsername={normalisedCurrentUsername}
          replyPlainMentionTarget={replyPlainMentionTarget}
          emoteTargetSize={emoteTargetSize}
          textColor={textColor}
        />
      </ChatText>
    </View>
  );
}

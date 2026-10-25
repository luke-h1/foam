import { View } from 'react-native';
import type { ReactNode } from 'react';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/getMessageStructure';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';

import { styles } from '../ChatRow.styles';
import type { BadgePressData } from '../ChatRow.types';
import { getChatTextStyles } from '../ChatText.styles';
import { ChatMessageBadges } from './ChatMessageBadges';
import { InlineTokens } from './InlineTokens';
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
          {...{ badges: badgeList, compact, fontScale, onBadgePress }}
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
          {...{
            emoteLineStyle,
            compact,
            disableEmoteAnimations,
            effectiveHighlightedUserSet,
            fontScale,
            getMentionColor,
            getTokenKey,
            onEmoteTouchStart,
            message,
            normalisedCurrentUsername,
            replyPlainMentionTarget,
            emoteTargetSize,
            textColor,
          }}
        />
      </ChatText>
    </View>
  );
}

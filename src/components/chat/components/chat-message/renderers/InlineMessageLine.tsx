import { View } from 'react-native';
import type { ReactNode } from 'react';

import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { BadgePressData } from '@app/store/chat/types/chat-press-data';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/getMessageStructure';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';

import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';
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
  density,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  fontScale,
  getMentionColor,
  onEmoteTouchStart,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
}: InlineMessageLineProps): ReactNode {
  const containsEmotes = getMessageStructure(message).containsEmotes;
  const textStyles = getChatTextStyles(fontScale, density);

  // TextKit sizes a wrapped line from its character ranges, so the taller
  // emote line height must apply to each nested span or emotes clip.
  const emoteLineStyle = containsEmotes ? textStyles.bodyEmoteLine : undefined;

  return (
    <View style={styles.messageLineInline}>
      <ChatRowText
        style={getChatRowTextStyle('muted', textStyles.body, emoteLineStyle)}
      >
        {showTimestamp && timestamp ? (
          <ChatRowText
            style={getChatRowTextStyle(
              'tabular',
              textStyles.timestamp,
              emoteLineStyle,
            )}
          >
            {`${timestamp} `}
          </ChatRowText>
        ) : null}
        <ChatMessageBadges
          {...{
            badges: badgeList,
            density,
            fontScale,
            isModerated: false,
            onBadgePress,
          }}
        />
        {username ? (
          <ChatRowText
            onPress={onUsernamePress}
            suppressHighlighting
            testID='chat-username-button'
            style={getChatRowTextStyle(
              'muted',
              textStyles.username,
              emoteLineStyle,
              usernameColor ? getChatColorStyle(usernameColor) : null,
            )}
          >
            {isAction ? `${username} ` : `${username}: `}
          </ChatRowText>
        ) : null}
        <InlineTokens
          {...{
            emoteLineStyle,
            density,
            disableEmoteAnimations,
            effectiveHighlightedUserSet,
            fontScale,
            getMentionColor,
            onEmoteTouchStart,
            message,
            normalisedCurrentUsername,
            replyPlainMentionTarget,
            emoteTargetSize,
            textColor,
          }}
        />
      </ChatRowText>
    </View>
  );
}

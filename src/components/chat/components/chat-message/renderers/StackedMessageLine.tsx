import { type TextStyle, View } from 'react-native';

import type { BadgePressData } from '@app/store/chat/types/chat-press-data';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flowsInline';

import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import { ChatRowUsername } from '../ChatRowUsername';
import type { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';
import { ChatMessageBadges } from './ChatMessageBadges';
import { InlineTokens } from './InlineTokens';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { WrappedTokens } from './WrappedTokens';

interface StackedMessageLineProps {
  badgeList: SanitisedBadgeSet[];
  bodyEmoteLineStyle: TextStyle | undefined;
  cachedSenderColor?: string;
  message: MessageToken[];
  onBadgePress?: (badge: BadgePressData) => void;
  onUsernamePress?: () => void;
  rendererArgs: Omit<ChatTokenRenderProps, 'message'>;
  replyPlainMentionTarget: string | undefined;
  showTimestamp: boolean;
  textColor: string | undefined;
  textStyles: ReturnType<typeof getChatTextStyles>;
  timestamp: string | undefined;
  userId?: string;
  username?: string;
  userstateColor?: string;
}

export function StackedMessageLine({
  badgeList,
  bodyEmoteLineStyle,
  cachedSenderColor,
  message,
  onBadgePress,
  onUsernamePress,
  rendererArgs,
  replyPlainMentionTarget,
  showTimestamp,
  textColor,
  textStyles,
  timestamp,
  userId,
  username,
  userstateColor,
}: StackedMessageLineProps) {
  const { density, fontScale, isModerated } = rendererArgs;

  /**
   * Re-derived here rather than passed in: the predicate also narrows the
   * tokens for InlineTokens, and that narrowing does not cross a prop.
   */
  const bodyFlowsInline = flowsInline(message, {
    hasPaint: false,
    isModerated,
  });

  return (
    <View
      style={[
        styles.messageLine,
        isModerated ? styles.messageLineModerated : null,
      ]}
    >
      {isModerated ? <View style={styles.moderatedStrikeOverlay} /> : null}
      {showTimestamp && timestamp ? (
        <ChatRowText
          style={getChatRowTextStyle('tabular', textStyles.timestamp)}
        >
          {timestamp}
        </ChatRowText>
      ) : null}
      <ChatMessageBadges
        {...{
          badges: badgeList,
          density,
          fontScale,
          isModerated,
          onBadgePress,
        }}
      />
      {username ? (
        <View style={isModerated ? styles.moderatedUsernameContainer : null}>
          <ChatRowUsername
            {...{
              cachedSenderColor,
              density,
              fontScale,
              isModerated,
              onUsernamePress,
              userId,
              userstateColor,
              username,
            }}
          />
        </View>
      ) : null}
      {bodyFlowsInline ? (
        <ChatRowText
          style={getChatRowTextStyle(
            'muted',
            textStyles.body,
            bodyEmoteLineStyle,
          )}
        >
          <InlineTokens
            {...rendererArgs}
            {...{
              emoteLineStyle: bodyEmoteLineStyle,
              message,
              replyPlainMentionTarget,
              textColor,
            }}
          />
        </ChatRowText>
      ) : (
        <WrappedTokens
          mode='message'
          {...rendererArgs}
          {...{ message, replyPlainMentionTarget, textColor }}
        />
      )}
    </View>
  );
}

import { View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import type { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-row.styles';
import type { BadgePressData } from '../chat-row.types';
import { ChatRowUsername } from '../chat-row-username';
import type { getChatTextStyles } from '../chat-text.styles';
import { ChatMessageBadges } from './chat-message-badges';
import { InlineTokens } from './inline-tokens';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { WrappedTokens } from './wrapped-tokens';

interface StackedMessageLineProps {
  badgeList: SanitisedBadgeSet[];
  bodyEmoteLineStyle: StyleProp<TextStyle>;
  cachedSenderColor?: string;
  isModerated: boolean;
  message: MessageToken[];
  moderationNotice: ChatTokenRenderProps['moderationNotice'];
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

/**
 * The stacked message line: timestamp, badges and username sit beside the
 * body rather than flowing inside it.
 */
export function StackedMessageLine({
  badgeList,
  bodyEmoteLineStyle,
  cachedSenderColor,
  message,
  isModerated,
  moderationNotice,
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
  const { compact, fontScale } = rendererArgs;

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
        moderationNotice ? styles.messageLineModerated : null,
      ]}
    >
      {moderationNotice ? <View style={styles.moderatedStrikeOverlay} /> : null}
      {showTimestamp && timestamp ? (
        <Text tabular style={textStyles.timestamp}>
          {timestamp}
        </Text>
      ) : null}
      <ChatMessageBadges
        badges={badgeList}
        compact={compact}
        fontScale={fontScale}
        moderationNotice={moderationNotice}
        onBadgePress={onBadgePress}
      />
      {username ? (
        <View
          style={moderationNotice ? styles.moderatedUsernameContainer : null}
        >
          <ChatRowUsername
            cachedSenderColor={cachedSenderColor}
            compact={compact}
            fontScale={fontScale}
            isModerated={Boolean(moderationNotice)}
            onUsernamePress={onUsernamePress}
            userId={userId}
            userstateColor={userstateColor}
            username={username}
          />
        </View>
      ) : null}
      {bodyFlowsInline ? (
        <Text style={[textStyles.body, bodyEmoteLineStyle]}>
          <InlineTokens
            {...rendererArgs}
            emoteLineStyle={bodyEmoteLineStyle}
            message={message}
            replyPlainMentionTarget={replyPlainMentionTarget}
            textColor={textColor}
          />
        </Text>
      ) : (
        <WrappedTokens
          mode='message'
          message={message}
          replyPlainMentionTarget={replyPlainMentionTarget}
          textColor={textColor}
          {...rendererArgs}
        />
      )}
    </View>
  );
}

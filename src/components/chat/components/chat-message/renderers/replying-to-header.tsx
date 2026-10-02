import { useMemo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chat-notice-accents';
import { SymbolView } from '@app/components/ui/icon/icon';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import type { MessageToken } from '@app/utils/chat/message-token';

import { ChatMessagePressable } from '../chat-message-pressable';
import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import {
  CHAT_SURFACE_COLORS,
  densityFromCompact,
  getChatScale,
} from '../util/chat-scale';
import { InlineTokens } from './inline-tokens';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { WrappedTokens } from './wrapped-tokens';

interface ReplyingToHeaderProps {
  canJumpToReplyTarget: boolean;
  isReplyingToCurrentUser: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  parentDisplayName?: string;
  replyBody?: string;
  replyParentMessageId?: string;
  rendererArgs: ChatTokenRenderProps;
}

export function ReplyingToHeader({
  canJumpToReplyTarget,
  isReplyingToCurrentUser,
  onReplyContextPress,
  parentDisplayName,
  replyBody,
  replyParentMessageId,
  rendererArgs,
}: ReplyingToHeaderProps) {
  const { parseTextForEmotes, ...tokenRenderProps } = rendererArgs;
  const { compact, fontScale } = rendererArgs;
  const replyPlainMentionTarget = normaliseChatUsername(parentDisplayName);

  const parsedReplyBody = useMemo((): MessageToken[] => {
    const trimmed = replyBody?.trim();

    if (!trimmed) {
      return [];
    }

    if (!parseTextForEmotes) {
      return [{ type: 'text', content: trimmed }];
    }

    return parseTextForEmotes(trimmed);
  }, [parseTextForEmotes, replyBody]);

  const prefix = isReplyingToCurrentUser
    ? 'Replying to you'
    : `Replying to @${parentDisplayName}`;

  const quoteFlowsInline = flowsInline(parsedReplyBody, {
    hasPaint: false,
    isModerated: false,
  });

  const quoteContainsEmotes =
    getMessageStructure(parsedReplyBody).containsEmotes;

  const replyContextIconColor = isReplyingToCurrentUser
    ? CHAT_NOTICE_ACCENTS.replyToYou
    : CHAT_SURFACE_COLORS.muted;

  const textStyles = getChatTextStyles(fontScale, compact);

  const { metaIconSize, replyEmoteSize } = getChatScale(
    fontScale,
    densityFromCompact(compact),
  );

  const replyContextPrefixTextStyle = [
    textStyles.replyContext,
    styles.replyContextPrefixFlex,
    isReplyingToCurrentUser && styles.replyContextTextReplyToYou,
  ];

  const replyContextBodyTextStyle = [
    textStyles.replyContext,
    isReplyingToCurrentUser && styles.replyContextTextReplyToYou,
  ];

  const content = (
    <>
      <SymbolView
        name='text.bubble'
        size={metaIconSize}
        tintColor={replyContextIconColor}
        style={styles.replyContextIcon}
      />
      <View style={styles.replyContextContent}>
        {quoteFlowsInline ? (
          <ChatText
            numberOfLines={1}
            style={[
              replyContextPrefixTextStyle,
              quoteContainsEmotes && textStyles.replyContextEmoteLine,
            ]}
          >
            <ChatText style={replyContextPrefixTextStyle}>
              {parsedReplyBody.length > 0 ? `${prefix}: ` : prefix}
            </ChatText>
            <InlineTokens
              {...tokenRenderProps}
              emoteTargetSize={replyEmoteSize}
              message={parsedReplyBody}
              replyPlainMentionTarget={replyPlainMentionTarget}
              textStyle={replyContextBodyTextStyle}
            />
          </ChatText>
        ) : (
          <>
            <ChatText numberOfLines={1} style={replyContextPrefixTextStyle}>
              {prefix}
            </ChatText>
            {parsedReplyBody.length > 0 ? (
              <View style={styles.replyContextBody}>
                <ChatText numberOfLines={1} style={replyContextBodyTextStyle}>
                  :{' '}
                </ChatText>
                <View style={styles.replyContextBodyParts}>
                  <WrappedTokens
                    {...tokenRenderProps}
                    emoteTargetSize={replyEmoteSize}
                    mode='message'
                    message={parsedReplyBody}
                    replyPlainMentionTarget={replyPlainMentionTarget}
                  />
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </>
  );

  if (canJumpToReplyTarget && replyParentMessageId) {
    return (
      <ChatMessagePressable
        hitSlop={undefined}
        onPress={() => onReplyContextPress?.(replyParentMessageId)}
        style={[
          styles.replyContextRow,
          styles.replyContextRowInteractive,
          isReplyingToCurrentUser && styles.replyContextRowReplyToYou,
        ]}
        testID='chat-reply-context-button'
      >
        {content}
      </ChatMessagePressable>
    );
  }

  return (
    <View
      style={[
        styles.replyContextRow,
        isReplyingToCurrentUser && styles.replyContextRowReplyToYou,
      ]}
    >
      {content}
    </View>
  );
}

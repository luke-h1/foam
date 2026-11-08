import { useMemo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flowsInline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/getMessageStructure';

import { ChatMessagePressable } from '../ChatMessagePressable';
import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { CHAT_SURFACE_COLORS, getChatScale } from '../util/chatScale';
import { parseMessageText } from '../util/parseMessageText';
import { InlineTokens } from './InlineTokens';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { WrappedTokens } from './WrappedTokens';

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
  const { density, fontScale } = rendererArgs;
  const replyPlainMentionTarget = normaliseChatUsername(parentDisplayName);

  const parsedReplyBody = useMemo(
    () => parseMessageText(replyBody, parseTextForEmotes),
    [parseTextForEmotes, replyBody],
  );

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

  const textStyles = getChatTextStyles(fontScale, density);

  const { metaIconSize, replyEmoteSize } = getChatScale(fontScale, density);

  const replyToYouStyle = [
    styles.replyContextRowReplyToYou,
    textStyles.replyToYouPill,
  ];

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
        style={textStyles.iconSpacing}
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
        onPress={() => onReplyContextPress?.(replyParentMessageId)}
        style={[
          styles.replyContextRow,
          textStyles.spaceBelow,
          styles.replyContextRowInteractive,
          isReplyingToCurrentUser && replyToYouStyle,
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
        textStyles.spaceBelow,
        isReplyingToCurrentUser && replyToYouStyle,
      ]}
    >
      {content}
    </View>
  );
}

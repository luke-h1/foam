import { useMemo } from 'react';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';
import {
  canRenderMessageInline,
  type InlineFlowPart,
} from '@app/components/Chat/util/canRenderMessageInline';
import { normaliseChatUsername } from '@app/components/Chat/util/chatUsernames/normaliseChatUsername';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatMessagePressable } from '../ChatMessagePressable';
import { CHAT_SURFACE_COLORS, getChatScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';
import { ChatMessageBody } from './ChatMessageBody';
import { InlineMessageSpans } from './InlineMessageSpans';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

interface ReplyingToHeaderProps {
  canJumpToReplyTarget: boolean;
  isReplyingToCurrentUser: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  parentDisplayName?: string;
  replyBody?: string;
  replyParentMessageId?: string;
  rendererArgs: ChatMessagePartRendererArgs;
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
  const { parseTextForEmotes, ...partRendererArgs } = rendererArgs;
  const { compact, fontScale } = rendererArgs;
  const replyPlainMentionTarget = normaliseChatUsername(parentDisplayName);
  const parsedReplyBody = useMemo((): ParsedPart[] => {
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
  const canRenderInlineQuote = canRenderMessageInline(parsedReplyBody, {
    hasPaint: false,
    isModerated: false,
  });
  const quoteContainsEmotes = parsedReplyBody.some(
    part => part.type === 'emote',
  );
  const replyContextIconColor = isReplyingToCurrentUser
    ? CHAT_NOTICE_ACCENTS.replyToYou
    : CHAT_SURFACE_COLORS.muted;
  const textStyles = getChatTextStyles(fontScale, compact);
  const replyEmoteSize = getChatScale(
    fontScale,
    compact ? 'compact' : 'comfortable',
  ).replyEmoteSize;
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
        name='bubble.left.fill'
        size={12}
        tintColor={replyContextIconColor}
        style={[
          styles.replyContextIcon,
          isReplyingToCurrentUser && styles.replyContextIconReplyToYou,
        ]}
      />
      <View style={styles.replyContextContent}>
        {canRenderInlineQuote ? (
          <Text
            numberOfLines={1}
            style={[
              replyContextPrefixTextStyle,
              quoteContainsEmotes && textStyles.replyContextEmoteLine,
            ]}
          >
            <Text style={replyContextPrefixTextStyle}>
              {parsedReplyBody.length > 0 ? `${prefix}: ` : prefix}
            </Text>
            <InlineMessageSpans
              {...partRendererArgs}
              emoteTargetSize={replyEmoteSize}
              message={parsedReplyBody as InlineFlowPart[]}
              replyPlainMentionTarget={replyPlainMentionTarget}
              textStyle={replyContextBodyTextStyle}
            />
          </Text>
        ) : (
          <>
            <Text numberOfLines={1} style={replyContextPrefixTextStyle}>
              {prefix}
            </Text>
            {parsedReplyBody.length > 0 ? (
              <View style={styles.replyContextBody}>
                <Text numberOfLines={1} style={replyContextBodyTextStyle}>
                  :{' '}
                </Text>
                <View style={styles.replyContextBodyParts}>
                  <ChatMessageBody
                    {...partRendererArgs}
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

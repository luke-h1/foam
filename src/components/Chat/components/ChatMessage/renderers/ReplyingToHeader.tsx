import { SymbolView } from '@app/components/ui/Icon/Icon';
import { useMemo } from 'react';
import { View } from 'react-native';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { Text } from '@app/components/ui/Text/Text';
import { CHAT_NOTICE_ACCENTS } from '../../util/chatNoticeAccents';
import { ChatMessagePressable } from '../ChatMessagePressable';
import { styles } from '../RichChatMessage.styles';
import { normaliseUsername } from '../richChatMessageHelpers';
import { ChatMessageBody } from './ChatMessageBody';
import {
  canRenderMessageInline,
  type InlineFlowPart,
} from '@app/components/Chat/util/canRenderMessageInline';
import { InlineMessageSpans } from './InlineMessageSpans';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

const REPLY_CONTEXT_EMOTE_SIZE_COMFORTABLE = 20;
const REPLY_CONTEXT_EMOTE_SIZE_COMPACT = 18;

interface ReplyingToHeaderProps {
  canJumpToReplyTarget: boolean;
  compact: boolean;
  isReplyingToCurrentUser: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  parentDisplayName?: string;
  replyBody?: string;
  replyParentMessageId?: string;
  rendererArgs: UseChatMessagePartRendererArgs;
}

export function ReplyingToHeader({
  canJumpToReplyTarget,
  compact,
  isReplyingToCurrentUser,
  onReplyContextPress,
  parentDisplayName,
  replyBody,
  replyParentMessageId,
  rendererArgs,
}: ReplyingToHeaderProps) {
  const { parseTextForEmotes, ...partRendererArgs } = rendererArgs;
  const replyPlainMentionTarget = normaliseUsername(parentDisplayName);
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
    : 'rgba(255, 255, 255, 0.5)';
  const replyContextPrefixTextStyle = [
    styles.replyContextPrefixText,
    compact && styles.replyContextTextCompact,
    isReplyingToCurrentUser && styles.replyContextTextReplyToYou,
  ];
  const replyContextBodyTextStyle = [
    styles.replyContextBodyText,
    compact && styles.replyContextTextCompact,
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
              quoteContainsEmotes && styles.replyContextEmoteLine,
            ]}
          >
            <Text style={replyContextPrefixTextStyle}>
              {parsedReplyBody.length > 0 ? `${prefix}: ` : prefix}
            </Text>
            <InlineMessageSpans
              {...partRendererArgs}
              compact={compact}
              emoteTargetSize={
                compact
                  ? REPLY_CONTEXT_EMOTE_SIZE_COMPACT
                  : REPLY_CONTEXT_EMOTE_SIZE_COMFORTABLE
              }
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
                    compact={compact}
                    emoteTargetSize={
                      compact
                        ? REPLY_CONTEXT_EMOTE_SIZE_COMPACT
                        : REPLY_CONTEXT_EMOTE_SIZE_COMFORTABLE
                    }
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

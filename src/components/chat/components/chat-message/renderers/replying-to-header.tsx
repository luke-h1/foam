import { useMemo } from 'react';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chat-notice-accents';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { canFlowInline } from '@app/utils/chat/derive-chat-body/can-flow-inline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import type { ParsedPart } from '@app/utils/chat/parsed-part';

import { ChatMessagePressable } from '../chat-message-pressable';
import { getChatTextStyles } from '../chat-text.styles';
import { styles } from '../rich-chat-message.styles';
import {
  CHAT_SURFACE_COLORS,
  densityFromCompact,
  getChatScale,
} from '../util/chat-scale';
import { ChatMessageBody } from './chat-message-body';
import { InlineMessageSpans } from './inline-message-spans';
import type { ChatMessagePartRendererArgs } from './types/chat-message-part-renderer-args';

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

  const canRenderInlineQuote = canFlowInline(parsedReplyBody, {
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
              message={parsedReplyBody}
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

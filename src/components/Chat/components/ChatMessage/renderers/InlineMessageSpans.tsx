import { memo, type ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { getChatColorStyle } from '@app/components/Chat/util/chatColorStyles';
import { Text } from '@app/components/ui/Text/Text';
import type { InlineFlowPart } from '@app/utils/chat/deriveChatBody/types';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { densityFromCompact, getChatScale } from '../chatScale';
import { getChatTextStyles } from '../chatText.styles';
import { EmoteRenderer } from './EmoteRenderer';
import { MentionSpan } from './MentionSpan';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

type InlineMessageSpansProps = Pick<
  ChatMessagePartRendererArgs,
  | 'compact'
  | 'disableEmoteAnimations'
  | 'effectiveHighlightedUserSet'
  | 'fontScale'
  | 'getMentionColor'
  | 'getPartKey'
  | 'onEmoteTouchStart'
  | 'normalisedCurrentUsername'
  | 'replyPlainMentionTarget'
  | 'emoteTargetSize'
> & {
  message: InlineFlowPart[];
  textStyle?: StyleProp<TextStyle>;
  /**
   * Line height override for every span on lines with emotes; each nested
   * span needs the taller line height or the emote attachment clips.
   */
  emoteLineStyle?: StyleProp<TextStyle>;
  textColor?: string;
};

function InlineMessageSpansComponent({
  compact,
  disableEmoteAnimations,
  effectiveHighlightedUserSet,
  fontScale,
  getMentionColor,
  getPartKey,
  onEmoteTouchStart,
  message,
  normalisedCurrentUsername,
  replyPlainMentionTarget,
  emoteTargetSize,
  textStyle,
  emoteLineStyle,
  textColor,
}: InlineMessageSpansProps) {
  const chatTextStyles = getChatTextStyles(fontScale, compact);
  const emoteSize =
    emoteTargetSize ??
    getChatScale(fontScale, densityFromCompact(compact)).emoteSize;
  const baseTextStyle = textStyle ?? [chatTextStyles.body, emoteLineStyle];
  const textColorStyle = textColor ? getChatColorStyle(textColor) : null;
  const spans: ReactNode[] = [];
  let pendingText: string | null = null;
  let pendingTextKey: ReturnType<typeof getPartKey> | null = null;

  const flushPendingText = () => {
    if (pendingText === null || pendingTextKey === null) {
      return;
    }
    spans.push(
      <Text
        key={pendingTextKey}
        color='gray.text'
        style={[baseTextStyle, textColorStyle]}
      >
        {pendingText}
      </Text>,
    );
    pendingText = null;
    pendingTextKey = null;
  };

  for (let index = 0; index < message.length; index += 1) {
    const part = message[index];
    if (!part) {
      continue;
    }

    if (part.type === 'text') {
      const content = getParsedPartStringContent(part);
      if (pendingText === null) {
        pendingText = content;
        pendingTextKey = getPartKey(part, index);
      } else {
        pendingText += content;
      }
      continue;
    }

    flushPendingText();

    if (part.type === 'emote') {
      spans.push(
        <EmoteRenderer
          disableAnimations={disableEmoteAnimations}
          key={getPartKey(part, index)}
          part={part}
          onEmoteTouchStart={onEmoteTouchStart}
          targetSize={emoteSize}
        />,
      );
      continue;
    }

    const content = getParsedPartStringContent(part);
    if (!content.trim()) {
      continue;
    }

    if (part.type === 'link') {
      spans.push(
        <Text
          key={getPartKey(part, index)}
          style={[chatTextStyles.link, emoteLineStyle]}
        >
          {content}
        </Text>,
      );
      continue;
    }

    // Self-subscribing so mention resolution re-renders only the span, not
    // the row - see MentionSpan.
    spans.push(
      <MentionSpan
        key={getPartKey(part, index)}
        content={content}
        baseTextStyle={baseTextStyle}
        emoteLineStyle={emoteLineStyle}
        compact={compact}
        fontScale={fontScale}
        getMentionColor={getMentionColor}
        effectiveHighlightedUserSet={effectiveHighlightedUserSet}
        normalisedCurrentUsername={normalisedCurrentUsername}
        replyPlainMentionTarget={replyPlainMentionTarget}
      />,
    );
  }

  flushPendingText();

  return <>{spans}</>;
}

export const InlineMessageSpans = memo(InlineMessageSpansComponent);

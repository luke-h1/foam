import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import type { InlineFlowPart } from '@app/components/Chat/util/canRenderMessageInline';
import { Text } from '@app/components/ui/Text/Text';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { getChatFontScaleStyle, styles } from '../RichChatMessage.styles';
import { EmoteRenderer } from './EmoteRenderer';
import { MentionSpan } from './MentionSpan';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

type InlineMessageSpansProps = Pick<
  UseChatMessagePartRendererArgs,
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
   * Line height override applied to every span on lines that contain emotes.
   * TextKit derives a wrapped line's height from the paragraph style of the
   * spans on it, so each nested span needs the taller line height or the
   * emote attachment overflows and clips.
   */
  emoteLineStyle?: StyleProp<TextStyle>;
};

export function InlineMessageSpans({
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
}: InlineMessageSpansProps) {
  const fontScaleStyle = getChatFontScaleStyle(fontScale, compact);
  const baseTextStyle = textStyle ?? [
    styles.messageText,
    compact && styles.messageTextCompact,
    fontScaleStyle,
    emoteLineStyle,
  ];
  const spans: ReactNode[] = [];
  let pendingText: string | null = null;
  let pendingTextKey: ReturnType<typeof getPartKey> | null = null;

  const flushPendingText = () => {
    if (pendingText === null || pendingTextKey === null) {
      return;
    }
    spans.push(
      <Text key={pendingTextKey} color='gray.text' style={baseTextStyle}>
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
          targetSize={emoteTargetSize ?? (compact ? 26 : 30)}
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
          style={[
            styles.messageLink,
            compact && styles.messageLinkCompact,
            fontScaleStyle,
            emoteLineStyle,
          ]}
        >
          {content}
        </Text>,
      );
      continue;
    }

    if (part.type === 'mention') {
      // A self-subscribing span so mention resolution re-renders only the span,
      // not the whole row (mentionLoginRevision is intentionally out of the
      // list's extraData — see MentionSpan).
      spans.push(
        <MentionSpan
          key={getPartKey(part, index)}
          content={content}
          baseTextStyle={baseTextStyle}
          fontScaleStyle={fontScaleStyle}
          emoteLineStyle={emoteLineStyle}
          compact={compact}
          getMentionColor={getMentionColor}
          effectiveHighlightedUserSet={effectiveHighlightedUserSet}
          normalisedCurrentUsername={normalisedCurrentUsername}
          replyPlainMentionTarget={replyPlainMentionTarget}
        />,
      );
      continue;
    }
  }

  flushPendingText();

  return <>{spans}</>;
}

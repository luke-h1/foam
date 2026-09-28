import { memo, type ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import { Text } from '@app/components/ui/text/text';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';
import { getMessageTokenText } from '@app/utils/chat/message-token-content';

import { getChatTextStyles } from '../chat-text.styles';
import { densityFromCompact, getChatScale } from '../util/chat-scale';
import { EmoteToken } from './emote-token';
import { MentionToken } from './mention-token';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

type InlineTokensProps = Pick<
  ChatTokenRenderProps,
  | 'compact'
  | 'disableEmoteAnimations'
  | 'effectiveHighlightedUserSet'
  | 'fontScale'
  | 'getMentionColor'
  | 'getTokenKey'
  | 'onEmoteTouchStart'
  | 'normalisedCurrentUsername'
  | 'replyPlainMentionTarget'
  | 'emoteTargetSize'
> & {
  message: InlineFlowToken[];
  textStyle?: StyleProp<TextStyle>;
  /**
   * Line height override for every span on lines with emotes; each nested
   * span needs the taller line height or the emote attachment clips.
   */
  emoteLineStyle?: StyleProp<TextStyle>;
  textColor?: string;
};

type InlineTokenDerived = {
  baseTextStyle: InlineTokensProps['textStyle'];
  chatTextStyles: ReturnType<typeof getChatTextStyles>;
  emoteSize: number;
};

/**
 * Renders one non-text token. Returns null for a token that has nothing to show,
 * so the caller can skip it without another branch.
 */
function renderInlineToken(
  token: InlineFlowToken,
  index: number,
  props: InlineTokensProps,
  { baseTextStyle, chatTextStyles, emoteSize }: InlineTokenDerived,
): ReactNode {
  const {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    emoteLineStyle,
    fontScale,
    getMentionColor,
    getTokenKey,
    normalisedCurrentUsername,
    onEmoteTouchStart,
    replyPlainMentionTarget,
  } = props;

  if (token.type === 'emote') {
    return (
      <EmoteToken
        disableAnimations={disableEmoteAnimations}
        key={getTokenKey(token, index)}
        token={token}
        onEmoteTouchStart={onEmoteTouchStart}
        targetSize={emoteSize}
      />
    );
  }

  const content = getMessageTokenText(token);

  if (!content.trim()) {
    return null;
  }

  if (token.type === 'link') {
    return (
      <Text
        key={getTokenKey(token, index)}
        style={[chatTextStyles.link, emoteLineStyle]}
      >
        {content}
      </Text>
    );
  }

  // Self-subscribing so mention resolution re-renders only the span, not
  // the row - see MentionToken.
  return (
    <MentionToken
      key={getTokenKey(token, index)}
      content={content}
      baseTextStyle={baseTextStyle}
      emoteLineStyle={emoteLineStyle}
      compact={compact}
      fontScale={fontScale}
      getMentionColor={getMentionColor}
      effectiveHighlightedUserSet={effectiveHighlightedUserSet}
      normalisedCurrentUsername={normalisedCurrentUsername}
      replyPlainMentionTarget={replyPlainMentionTarget}
    />
  );
}

function InlineTokensComponent(props: InlineTokensProps) {
  const {
    compact,
    fontScale,
    getTokenKey,
    message,
    emoteTargetSize,
    textStyle,
    emoteLineStyle,
    textColor,
  } = props;

  const chatTextStyles = getChatTextStyles(fontScale, compact);

  const emoteSize =
    emoteTargetSize ??
    getChatScale(fontScale, densityFromCompact(compact)).emoteSize;

  const baseTextStyle = textStyle ?? [chatTextStyles.body, emoteLineStyle];
  const textColorStyle = textColor ? getChatColorStyle(textColor) : null;
  const spans: ReactNode[] = [];
  let pendingText: string | null = null;
  let pendingTextKey: ReturnType<typeof getTokenKey> | null = null;

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
    const token = message[index];

    if (!token) {
      continue;
    }

    if (token.type === 'text') {
      const content = getMessageTokenText(token);

      pendingTextKey =
        pendingText === null ? getTokenKey(token, index) : pendingTextKey;

      pendingText = (pendingText ?? '') + content;

      continue;
    }

    flushPendingText();

    const span = renderInlineToken(token, index, props, {
      baseTextStyle,
      chatTextStyles,
      emoteSize,
    });

    if (span) {
      spans.push(span);
    }
  }

  flushPendingText();

  return <>{spans}</>;
}

export const InlineTokens = memo(InlineTokensComponent);

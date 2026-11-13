import { memo, type ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

import { getChatTextStyles } from '../ChatText.styles';
import { getChatScale } from '../util/chatScale';
import { groupTextRuns } from '../util/groupTextRuns';
import { EmoteToken } from './EmoteToken';
import { MentionToken } from './MentionToken';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

type InlineTokensProps = Pick<
  ChatTokenRenderProps,
  | 'density'
  | 'disableEmoteAnimations'
  | 'effectiveHighlightedUserSet'
  | 'fontScale'
  | 'getMentionColor'
  | 'onEmoteTouchStart'
  | 'normalisedCurrentUsername'
  | 'replyPlainMentionTarget'
  | 'emoteTargetSize'
> & {
  message: InlineFlowToken[];
  textStyle?: StyleProp<TextStyle>;
  emoteLineStyle?: StyleProp<TextStyle>;
  textColor?: string;
};

type InlineTokenDerived = {
  baseTextStyle: InlineTokensProps['textStyle'];
  chatTextStyles: ReturnType<typeof getChatTextStyles>;
  emoteSize: number;
};

function renderInlineToken(
  token: InlineFlowToken,
  index: number,
  props: InlineTokensProps,
  { baseTextStyle, chatTextStyles, emoteSize }: InlineTokenDerived,
): ReactNode {
  const {
    density,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    emoteLineStyle,
    fontScale,
    getMentionColor,
    normalisedCurrentUsername,
    onEmoteTouchStart,
    replyPlainMentionTarget,
  } = props;

  if (token.type === 'emote') {
    return (
      <EmoteToken
        key={getTokenIdentity(token, index)}
        {...{
          disableAnimations: disableEmoteAnimations,
          token,
          onEmoteTouchStart,
          targetSize: emoteSize,
        }}
      />
    );
  }

  const content = getMessageTokenText(token);

  if (!content.trim()) {
    return null;
  }

  if (token.type === 'link') {
    return (
      <ChatText
        key={getTokenIdentity(token, index)}
        style={[chatTextStyles.link, emoteLineStyle]}
      >
        {content}
      </ChatText>
    );
  }

  // Self-subscribing so mention resolution re-renders only the span, not
  // the row - see MentionToken.
  return (
    <MentionToken
      key={getTokenIdentity(token, index)}
      {...{
        content,
        baseTextStyle,
        emoteLineStyle,
        density,
        fontScale,
        getMentionColor,
        effectiveHighlightedUserSet,
        normalisedCurrentUsername,
        replyPlainMentionTarget,
      }}
    />
  );
}

function InlineTokensComponent(props: InlineTokensProps) {
  const {
    density,
    fontScale,
    message,
    emoteTargetSize,
    textStyle,
    emoteLineStyle,
    textColor,
  } = props;

  const chatTextStyles = getChatTextStyles(fontScale, density);

  const emoteSize =
    emoteTargetSize ?? getChatScale(fontScale, density).emoteSize;

  const baseTextStyle = textStyle ?? [chatTextStyles.body, emoteLineStyle];
  const textColorStyle = textColor ? getChatColorStyle(textColor) : null;

  return (
    <>
      {groupTextRuns(message).map(run => {
        if (run.kind === 'token') {
          return renderInlineToken(run.token, run.index, props, {
            baseTextStyle,
            chatTextStyles,
            emoteSize,
          });
        }

        if (run.content.trim() === '') {
          return run.content;
        }

        return (
          <ChatText
            key={`text-${run.index}`}
            color='gray.text'
            style={[baseTextStyle, textColorStyle]}
          >
            {run.content}
          </ChatText>
        );
      })}
    </>
  );
}

export const InlineTokens = memo(InlineTokensComponent);

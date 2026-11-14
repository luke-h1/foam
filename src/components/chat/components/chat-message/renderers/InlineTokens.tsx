import { memo, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';

import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { InlineFlowToken } from '@app/utils/chat/derive-chat-body/types';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

import { ChatRowText } from '../ChatRowText';
import { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';
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
  textStyle?: TextStyle;
  textAccentStyle?: TextStyle | false;
  emoteLineStyle?: TextStyle;
  textColor?: string;
};

interface InlineTokenDerived {
  baseRowTextStyle: TextStyle;
  chatTextStyles: ReturnType<typeof getChatTextStyles>;
  emoteSize: number;
}

function renderInlineToken(
  token: InlineFlowToken,
  index: number,
  props: InlineTokensProps,
  { baseRowTextStyle, chatTextStyles, emoteSize }: InlineTokenDerived,
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
      <ChatRowText
        key={getTokenIdentity(token, index)}
        style={getChatRowTextStyle(
          'muted',
          chatTextStyles.link,
          emoteLineStyle,
        )}
      >
        {content}
      </ChatRowText>
    );
  }

  // Self-subscribing so mention resolution re-renders only the span, not
  // the row - see MentionToken.
  return (
    <MentionToken
      key={getTokenIdentity(token, index)}
      {...{
        content,
        baseRowTextStyle,
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
    textAccentStyle,
    emoteLineStyle,
    textColor,
  } = props;

  const chatTextStyles = getChatTextStyles(fontScale, density);

  const emoteSize =
    emoteTargetSize ?? getChatScale(fontScale, density).emoteSize;

  const bodyStyle = textStyle ?? chatTextStyles.body;
  const bodyAccentStyle = textStyle ? textAccentStyle : emoteLineStyle;
  const baseRowTextStyle = getChatRowTextStyle(
    'text',
    bodyStyle,
    bodyAccentStyle,
  );
  const textColorStyle = textColor ? getChatColorStyle(textColor) : null;

  return (
    <>
      {groupTextRuns(message).map(run => {
        if (run.kind === 'token') {
          return renderInlineToken(run.token, run.index, props, {
            baseRowTextStyle,
            chatTextStyles,
            emoteSize,
          });
        }

        if (run.content.trim() === '') {
          return run.content;
        }

        return (
          <ChatRowText
            key={`text-${run.index}`}
            style={getChatRowTextStyle(
              'text',
              bodyStyle,
              bodyAccentStyle,
              textColorStyle,
            )}
          >
            {run.content}
          </ChatRowText>
        );
      })}
    </>
  );
}

export const InlineTokens = memo(InlineTokensComponent);

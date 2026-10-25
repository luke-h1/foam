import type { MessageToken } from '@app/utils/chat/messageToken';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

import { ChatMessageToken } from './ChatMessageToken';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

type WrappedTokensProps = ChatTokenRenderProps & {
  mode: 'message' | 'system';
};

/**
 * Neighbouring text tokens render as one Text node, so a run grows by appending
 * to the token already collected.
 */
const appendToTextRun = (
  run: MessageToken<'text'> | null,
  content: string,
): MessageToken<'text'> => ({
  type: 'text',
  content: run === null ? content : run.content + content,
});

export function WrappedTokens({
  mode,
  message,
  compact,
  disableEmoteAnimations,
  fontScale,
  effectiveHighlightedUserSet,
  getMentionColor,
  getTokenKey,
  onEmoteTouchStart,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
}: WrappedTokensProps) {
  /**
   * A literal, not object-rest: rest materialization is a fresh object the
   * React Compiler cannot cache, invalidating every memo scope keyed on it.
   */
  const rendererArgs = {
    compact,
    disableEmoteAnimations,
    fontScale,
    effectiveHighlightedUserSet,
    getMentionColor,
    getTokenKey,
    onEmoteTouchStart,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags,
    parseTextForEmotes,
    replyPlainMentionTarget,
    emoteTargetSize,
    textColor,
  };

  const renderedParts = [];
  let currentTextPart: MessageToken<'text'> | null = null;
  let currentTextIndex = 0;

  const pushCurrentTextPart = () => {
    if (!currentTextPart) {
      return;
    }

    renderedParts.push(
      <ChatMessageToken
        {...rendererArgs}
        {...{
          key: rendererArgs.getTokenKey(currentTextPart, currentTextIndex),
          index: currentTextIndex,
          message,
          mode,
          token: currentTextPart,
        }}
      />,
    );

    currentTextPart = null;
  };

  for (let index = 0; index < message.length; index += 1) {
    const token = message[index];

    if (!token) {
      continue;
    }

    if (token.type === 'text') {
      const content = getMessageTokenText(token);

      // Neighboring text tokens render as one Text node, anchored at the
      // index of the run's first token.
      currentTextIndex = currentTextPart === null ? index : currentTextIndex;
      currentTextPart = appendToTextRun(currentTextPart, content);

      continue;
    }

    pushCurrentTextPart();

    renderedParts.push(
      <ChatMessageToken
        {...rendererArgs}
        {...{
          key: rendererArgs.getTokenKey(token, index),
          index,
          message,
          mode,
          token,
        }}
      />,
    );
  }

  pushCurrentTextPart();

  return <>{renderedParts}</>;
}

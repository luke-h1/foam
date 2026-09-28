import type { MessageToken } from '@app/utils/chat/message-token';
import { getMessageTokenText } from '@app/utils/chat/message-token-content';

import { ChatMessageToken } from './chat-message-token';
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
        key={rendererArgs.getTokenKey(currentTextPart, currentTextIndex)}
        index={currentTextIndex}
        message={message}
        mode={mode}
        token={currentTextPart}
        {...rendererArgs}
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

      // Neighbouring text tokens render as one Text node, anchored at the
      // index of the run's first token.
      currentTextIndex = currentTextPart === null ? index : currentTextIndex;
      currentTextPart = appendToTextRun(currentTextPart, content);

      continue;
    }

    pushCurrentTextPart();

    renderedParts.push(
      <ChatMessageToken
        key={rendererArgs.getTokenKey(token, index)}
        index={index}
        message={message}
        mode={mode}
        token={token}
        {...rendererArgs}
      />,
    );
  }

  pushCurrentTextPart();

  return <>{renderedParts}</>;
}

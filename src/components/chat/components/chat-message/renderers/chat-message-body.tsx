import type { ParsedPart } from '@app/utils/chat/parsed-part';
import { getParsedPartStringContent } from '@app/utils/chat/parsed-part-content';

import { ChatMessagePart } from './chat-message-part';
import type { ChatMessagePartRendererArgs } from './types/chat-message-part-renderer-args';

type ChatMessageBodyProps = ChatMessagePartRendererArgs & {
  mode: 'message' | 'system';
};

/**
 * Neighbouring text parts render as one Text node, so a run grows by appending
 * to the part already collected.
 */
const appendToTextRun = (
  run: ParsedPart<'text'> | null,
  content: string,
): ParsedPart<'text'> => ({
  type: 'text',
  content: run === null ? content : run.content + content,
});

export function ChatMessageBody({
  mode,
  message,
  compact,
  disableEmoteAnimations,
  fontScale,
  effectiveHighlightedUserSet,
  getMentionColor,
  getPartKey,
  onEmoteTouchStart,
  moderationNotice,
  normalisedCurrentUsername,
  noticeTags,
  parseTextForEmotes,
  replyPlainMentionTarget,
  emoteTargetSize,
  textColor,
}: ChatMessageBodyProps) {
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
    getPartKey,
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
  let currentTextPart: ParsedPart<'text'> | null = null;
  let currentTextIndex = 0;

  const pushCurrentTextPart = () => {
    if (!currentTextPart) {
      return;
    }

    renderedParts.push(
      <ChatMessagePart
        key={rendererArgs.getPartKey(currentTextPart, currentTextIndex)}
        index={currentTextIndex}
        message={message}
        mode={mode}
        part={currentTextPart}
        {...rendererArgs}
      />,
    );

    currentTextPart = null;
  };

  for (let index = 0; index < message.length; index += 1) {
    const part = message[index];

    if (!part) {
      continue;
    }

    if (part.type === 'text') {
      const content = getParsedPartStringContent(part);

      // Neighbouring text parts render as one Text node, anchored at the
      // index of the run's first part.
      currentTextIndex = currentTextPart === null ? index : currentTextIndex;
      currentTextPart = appendToTextRun(currentTextPart, content);

      continue;
    }

    pushCurrentTextPart();

    renderedParts.push(
      <ChatMessagePart
        key={rendererArgs.getPartKey(part, index)}
        index={index}
        message={message}
        mode={mode}
        part={part}
        {...rendererArgs}
      />,
    );
  }

  pushCurrentTextPart();

  return <>{renderedParts}</>;
}

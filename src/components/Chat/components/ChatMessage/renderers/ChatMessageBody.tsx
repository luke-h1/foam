import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { ChatMessagePart } from './ChatMessagePart';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

type ChatMessageBodyProps = ChatMessagePartRendererArgs & {
  mode: 'message' | 'system';
};

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
      if (currentTextPart) {
        currentTextPart = {
          type: 'text',
          content: currentTextPart.content + content,
        };
      } else {
        currentTextPart = { type: 'text', content };
        currentTextIndex = index;
      }
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

import type { StyleProp, TextStyle } from 'react-native';

import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getParsedPartStringContent } from '@app/utils/chat/parsedPartContent';

import { ChatMessagePart } from './ChatMessagePart';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

type ChatMessageBodyProps = UseChatMessagePartRendererArgs & {
  mode: 'message' | 'system';
  /**
   * Metrics for text, link and mention parts on surfaces that render the body
   * at a different scale than the chat line (the reply quote).
   */
  bodyTextStyle?: StyleProp<TextStyle>;
  linkTextStyle?: StyleProp<TextStyle>;
  mentionTextStyle?: StyleProp<TextStyle>;
};

export function ChatMessageBody({
  mode,
  message,
  ...rendererArgs
}: ChatMessageBodyProps) {
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

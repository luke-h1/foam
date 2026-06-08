import { Host, Text as SwiftUIText } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import type { ChatCommandFeedback } from '../util/chatCommands';

interface ChatCommandFeedbackProps {
  feedback: ChatCommandFeedback | null;
}

export function ChatCommandFeedbackView({
  feedback,
}: ChatCommandFeedbackProps) {
  if (!feedback || feedback.status === 'valid' || !feedback.message) {
    return null;
  }

  const color =
    feedback.status === 'error' ? '#FF453A' : 'rgba(255,255,255,0.56)';

  return (
    <Host matchContents>
      <SwiftUIText
        modifiers={[
          foregroundStyle(color),
          font({ size: 12 }),
          padding({ top: 4, horizontal: 4 }),
        ]}
      >
        {feedback.message}
      </SwiftUIText>
    </Host>
  );
}

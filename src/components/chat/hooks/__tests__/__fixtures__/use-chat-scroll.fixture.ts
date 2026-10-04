import type { ChatScrollAnchor } from '@app/components/chat/hooks/use-chat-scroll';

export function createScrollAnchor(
  overrides: Partial<ChatScrollAnchor> = {},
): ChatScrollAnchor {
  return {
    isAtBottomRef: { current: true },
    isScrollingToBottomRef: { current: false },
    isUserActivelyScrolling: () => false,
    noteScrollAwayIntent: () => {},
    maintainBottomAfterContentChange: () => {},
    ...overrides,
  };
}

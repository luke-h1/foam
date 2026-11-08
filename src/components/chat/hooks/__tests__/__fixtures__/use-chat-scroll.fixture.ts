import type { ChatListRef } from '@app/components/chat/components/ChatList';
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

export function createChatListRef(
  overrides: Partial<ChatListRef> = {},
): ChatListRef {
  return {
    clearCaches: jest.fn(),
    flashScrollIndicators: jest.fn(),
    getAnimatableRef: jest.fn(),
    getNativeScrollRef: jest.fn(),
    getScrollableNode: jest.fn(),
    getScrollResponder: jest.fn(),
    getState: jest.fn(),
    reportContentInset: jest.fn(),
    scrollIndexIntoView: jest.fn(),
    scrollItemIntoView: jest.fn(),
    scrollToEnd: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToItem: jest.fn(),
    scrollToOffset: jest.fn(),
    setItemSize: jest.fn(),
    setScrollProcessingEnabled: jest.fn(),
    setVisibleContentAnchorOffset: jest.fn(),
    ...overrides,
  };
}

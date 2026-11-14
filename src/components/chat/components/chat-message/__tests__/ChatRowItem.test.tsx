import { StyleSheet } from 'react-native';

import { screen } from '@testing-library/react-native';

import type { ChatRowDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import render from '@app/test/render';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

import { ChatRowItem } from '../ChatRowItem';

const moderatedMessage = createChatMessageFixture({
  message: [{ type: 'text', content: 'buy followers' }],
  moderationNotice: 'Deleted',
});

function renderRow(message: AnyChatMessageType, animate = false) {
  return (
    <ChatRowItem
      chatDensity='comfortable'
      channelId='1'
      currentUsernameNormalized=''
      displayFlags={{
        animate,
        disableEmoteAnimations: false,
        fontScale: 'default',
        showAlternatingChatRows: false,
        showInlineReplyContext: true,
        showTimestamps: false,
      }}
      getMentionColor={() => '#FFFFFF'}
      highlightedUserSet={new Set()}
      index={0}
      message={message}
      onBadgePress={jest.fn()}
      onMessageLongPress={jest.fn()}
      onReplyContextPress={jest.fn()}
      onUsernamePress={jest.fn()}
      parseTextForEmotes={text => [{ type: 'text', content: text }]}
    />
  );
}

function countEntranceWrappers(): number {
  return screen.UNSAFE_root.findAll(
    node => node.props['entering'] !== undefined,
  ).length;
}

describe('ChatRowItem', () => {
  const now = 10_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('a recycled row plays the entrance for a fresh message', () => {
    const scrollback = createChatMessageFixture({
      id: 'old',
      isHistorical: true,
    });
    const live = createChatMessageFixture({ id: 'live', committedAt: now });

    const { rerender } = render(renderRow(scrollback, true));
    expect(countEntranceWrappers()).toBe(0);

    rerender(renderRow(live, true));
    expect(countEntranceWrappers()).toBeGreaterThan(0);
  });

  test('a recycled row skips the entrance for a historical message', () => {
    const live = createChatMessageFixture({ id: 'live', committedAt: now });
    const scrollback = createChatMessageFixture({
      id: 'old',
      isHistorical: true,
    });

    const { rerender } = render(renderRow(live, true));
    expect(countEntranceWrappers()).toBeGreaterThan(0);

    rerender(renderRow(scrollback, true));
    expect(countEntranceWrappers()).toBe(0);
  });

  test('passes the moderation notice through, so the row strikes the body', () => {
    render(renderRow(moderatedMessage));

    const style = StyleSheet.flatten(
      screen.getByText('buy followers').props['style'],
    );

    expect(style.textDecorationLine).toBe('line-through');
  });

  test('decides the entrance again when a recycled row gets a new message', () => {
    const displayFlags: ChatRowDisplayFlags = {
      animate: true,
      disableEmoteAnimations: false,
      fontScale: 'default',
      showAlternatingChatRows: false,
      showInlineReplyContext: true,
      showTimestamps: false,
    };

    const renderRow = (message: AnyChatMessageType) => (
      <ChatRowItem
        chatDensity='comfortable'
        channelId='1'
        currentUsernameNormalized=''
        displayFlags={displayFlags}
        getMentionColor={() => '#FFFFFF'}
        highlightedUserSet={new Set()}
        index={0}
        message={message}
        onBadgePress={jest.fn()}
        onMessageLongPress={jest.fn()}
        onReplyContextPress={jest.fn()}
        onUsernamePress={jest.fn()}
        parseTextForEmotes={text => [{ type: 'text', content: text }]}
      />
    );

    const scrollback = createChatMessageFixture({ isHistorical: true });

    const live = createChatMessageFixture({
      committedAt: Date.now(),
      id: 'msg-2_nonce-2',
      message_id: 'msg-2',
      message_nonce: 'nonce-2',
    });

    const { rerender } = render(renderRow(scrollback));
    const countAnimatedViews = () =>
      screen.UNSAFE_root.findAll(node => node.props['entering'] != null).length;

    const animatedForScrollback = countAnimatedViews();

    rerender(renderRow(live));

    expect([animatedForScrollback, countAnimatedViews() > 0]).toEqual([
      0,
      true,
    ]);
  });

  test('renders mention and emote tokens without spreading a key prop', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const message = createChatMessageFixture({
      message: [
        { type: 'mention', content: '@luke' },
        { type: 'text', content: ' hi ' },
        {
          type: 'emote',
          content: 'Kappa',
          id: 'kappa',
          name: 'Kappa',
          url: 'https://cdn.example/kappa.webp',
        },
      ],
    });

    render(
      <ChatRowItem
        chatDensity='comfortable'
        channelId='1'
        currentUsernameNormalized=''
        displayFlags={{
          animate: false,
          disableEmoteAnimations: false,
          fontScale: 'default',
          showAlternatingChatRows: false,
          showInlineReplyContext: true,
          showTimestamps: false,
        }}
        getMentionColor={() => '#FFFFFF'}
        highlightedUserSet={new Set()}
        index={0}
        message={message}
        onBadgePress={jest.fn()}
        onMessageLongPress={jest.fn()}
        onReplyContextPress={jest.fn()}
        onUsernamePress={jest.fn()}
        parseTextForEmotes={text => [{ type: 'text', content: text }]}
      />,
    );

    const keySpreadErrors = consoleError.mock.calls.filter(call =>
      String(call[0]).includes('"key" prop is being spread'),
    );

    consoleError.mockRestore();

    expect(keySpreadErrors).toEqual([]);
  });
});

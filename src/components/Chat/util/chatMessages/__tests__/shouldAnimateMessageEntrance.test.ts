import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';

import { shouldAnimateMessageEntrance } from '../shouldAnimateMessageEntrance';

describe('shouldAnimateMessageEntrance', () => {
  test('animates a message committed moments before mount', () => {
    const message = createChatMessageFixture({ committedAt: 10_000 });

    expect(shouldAnimateMessageEntrance(message, 10_016)).toBe(true);
  });

  test('does not animate a scrollback row remounting long after commit', () => {
    const message = createChatMessageFixture({ committedAt: 10_000 });

    expect(shouldAnimateMessageEntrance(message, 11_000)).toBe(false);
  });

  test('does not animate replayed history even when freshly committed', () => {
    const message = createChatMessageFixture({
      committedAt: 10_000,
      isHistorical: true,
    });

    expect(shouldAnimateMessageEntrance(message, 10_016)).toBe(false);
  });

  test('does not animate a message that never got a commit stamp', () => {
    const message = createChatMessageFixture({ committedAt: undefined });

    expect(shouldAnimateMessageEntrance(message, 10_016)).toBe(false);
  });
});

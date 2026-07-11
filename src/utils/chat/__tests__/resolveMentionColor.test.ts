import { getUserMessageColor } from '@app/store/chat/actions/messages';

import { resolveMentionColor } from '../resolveMentionColor';

jest.mock('@app/store/chat/actions/messages', () => ({
  getUserMessageColor: jest.fn(),
}));

const mockGetUserMessageColor = jest.mocked(getUserMessageColor);

describe('resolveMentionColor', () => {
  beforeEach(() => {
    mockGetUserMessageColor.mockReturnValue(undefined);
  });

  test('uses chat history color for the mentioned user', () => {
    mockGetUserMessageColor.mockReturnValue('#9147FF');

    expect(resolveMentionColor('BungleXO')).toBe('rgb(145, 71, 255)');
    expect(getUserMessageColor).toHaveBeenCalledWith('BungleXO');
  });

  test('falls back to deterministic palette when user has not chatted', () => {
    const color = resolveMentionColor('@SomeUser');

    expect(color).toBe('rgb(255, 105, 180)');
    expect(getUserMessageColor).toHaveBeenCalledWith('SomeUser');
  });

  test('returns a colour without consulting chat history for empty input', () => {
    expect(resolveMentionColor('')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(getUserMessageColor).not.toHaveBeenCalled();
  });

  test('returns a colour without consulting chat history for @-only input', () => {
    expect(resolveMentionColor('@')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(getUserMessageColor).not.toHaveBeenCalled();
  });
});

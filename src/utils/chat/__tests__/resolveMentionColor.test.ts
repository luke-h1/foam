import { getUserMessageColor } from '@app/store/chatStore/messages';
import { resolveMentionColor } from '../resolveMentionColor';

jest.mock('@app/store/chatStore/messages', () => ({
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

    expect(color).toMatch(/^rgb\(/);
    expect(getUserMessageColor).toHaveBeenCalledWith('SomeUser');
  });
});

import * as messageColorIndex from '@app/store/chat/actions/messageColorIndex';

import { resolveMentionColor } from '../resolveMentionColor';

describe('resolveMentionColor', () => {
  let mockGetUserMessageColor: jest.SpiedFunction<
    typeof messageColorIndex.getUserMessageColor
  >;

  beforeEach(() => {
    mockGetUserMessageColor = jest
      .spyOn(messageColorIndex, 'getUserMessageColor')
      .mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('uses chat history color for the mentioned user', () => {
    mockGetUserMessageColor.mockReturnValue('#9147FF');

    expect(resolveMentionColor('VelvetFathom93')).toBe('rgb(158, 93, 255)');
    expect(mockGetUserMessageColor).toHaveBeenCalledWith('VelvetFathom93');
  });

  test('falls back to deterministic palette when user has not chatted', () => {
    const color = resolveMentionColor('@SomeUser');

    expect(color).toBe('rgb(255, 105, 180)');
    expect(mockGetUserMessageColor).toHaveBeenCalledWith('SomeUser');
  });

  test('returns a colour without consulting chat history for empty input', () => {
    expect(resolveMentionColor('')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(mockGetUserMessageColor).not.toHaveBeenCalled();
  });

  test('returns a colour without consulting chat history for @-only input', () => {
    expect(resolveMentionColor('@')).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(mockGetUserMessageColor).not.toHaveBeenCalled();
  });
});

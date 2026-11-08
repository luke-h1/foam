import * as messageColorIndex from '@app/store/chat/actions/message-color-index';

import { getFallbackSenderColor } from '../getFallbackSenderColor';
import { cachedLighten } from '../resolve-cached-sender-color/cachedLighten';
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

    expect(resolveMentionColor('VelvetFathom93')).toBe(
      cachedLighten('#9147FF'),
    );

    expect(mockGetUserMessageColor).toHaveBeenCalledWith('velvetfathom93');
  });

  test('falls back to one palette colour for every spelling of a login', () => {
    expect([
      resolveMentionColor('@SomeUser'),
      resolveMentionColor('someuser'),
    ]).toEqual([
      cachedLighten(getFallbackSenderColor('someuser')),
      cachedLighten(getFallbackSenderColor('someuser')),
    ]);

    expect(mockGetUserMessageColor).toHaveBeenCalledWith('someuser');
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

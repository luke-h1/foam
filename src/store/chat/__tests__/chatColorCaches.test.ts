import {
  CHAT_SESSION_CACHE_TTL_MS,
  clearMentionSessionCaches,
  clearSessionCache,
  getSessionCacheString,
  setSessionCacheString,
} from '../actions/chatColorCaches';

describe('chatColorCaches', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  test('stores and reads values before expiry', () => {
    setSessionCacheString('mentionColors', 'luke', '#ffffff');

    expect(getSessionCacheString('mentionColors', 'luke')).toBe('#ffffff');
  });

  test('expires mention colours after the TTL', () => {
    jest.useFakeTimers();
    setSessionCacheString('mentionColors', 'luke', '#ffffff');

    jest.advanceTimersByTime(CHAT_SESSION_CACHE_TTL_MS + 1);

    expect(getSessionCacheString('mentionColors', 'luke')).toBeUndefined();

    jest.useRealTimers();
  });

  test('lightened colours never expire — they memoize a pure function', () => {
    jest.useFakeTimers();
    setSessionCacheString('lightenedColors', '#ff0000', 'rgb(255, 0, 0)');

    jest.advanceTimersByTime(CHAT_SESSION_CACHE_TTL_MS * 10);

    expect(getSessionCacheString('lightenedColors', '#ff0000')).toBe(
      'rgb(255, 0, 0)',
    );

    jest.useRealTimers();
  });

  test('drops oldest entries once a bucket exceeds its cap', () => {
    for (let i = 0; i < 201; i += 1) {
      setSessionCacheString('lightenedColors', `#${i}`, `value-${i}`);
    }

    expect(getSessionCacheString('lightenedColors', '#0')).toBeUndefined();
    expect(getSessionCacheString('lightenedColors', '#200')).toBe('value-200');
  });

  test('clearMentionSessionCaches clears both colour buckets', () => {
    setSessionCacheString('mentionColors', 'luke', '#ffffff');
    setSessionCacheString('lightenedColors', '#ff0000', 'rgb(255, 0, 0)');

    clearMentionSessionCaches();

    expect(getSessionCacheString('mentionColors', 'luke')).toBeUndefined();
    expect(getSessionCacheString('lightenedColors', '#ff0000')).toBeUndefined();
  });
});

import {
  clearMentionSessionCaches,
  clearSessionCache,
  getSessionCacheString,
  setSessionCacheString,
} from '../actions/chat-color-caches';

describe('chatColorCaches', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('stores and reads values before expiry', () => {
    setSessionCacheString('mentionColors', 'luke', '#ffffff');

    expect(getSessionCacheString('mentionColors', 'luke')).toBe('#ffffff');
  });

  test('expires mention colours after 30 seconds', () => {
    jest.useFakeTimers();
    setSessionCacheString('mentionColors', 'luke', '#ffffff');

    jest.advanceTimersByTime(29_000);
    const beforeExpiry = getSessionCacheString('mentionColors', 'luke');

    jest.advanceTimersByTime(2000);

    expect([
      beforeExpiry,
      getSessionCacheString('mentionColors', 'luke'),
    ]).toEqual(['#ffffff', undefined]);
  });

  test('lightened colours never expire - they memoize a pure function', () => {
    jest.useFakeTimers();
    setSessionCacheString('lightenedColors', '#ff0000', 'rgb(255, 0, 0)');

    jest.advanceTimersByTime(300_000);

    expect(getSessionCacheString('lightenedColors', '#ff0000')).toBe(
      'rgb(255, 0, 0)',
    );
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

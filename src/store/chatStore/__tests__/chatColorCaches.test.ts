import { chatStore$ } from '../state';
import {
  CHAT_SESSION_CACHE_TTL_MS,
  clearMentionSessionCaches,
  clearSessionCache,
  getSessionCacheString,
  setSessionCacheString,
} from '../chatColorCaches';

describe('chatColorCaches', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  test('stores and reads values before expiry', () => {
    setSessionCacheString('mentionColors', 'luke', '#ffffff');

    expect(getSessionCacheString('mentionColors', 'luke')).toBe('#ffffff');
  });

  test('expires entries after the TTL', () => {
    jest.useFakeTimers();
    setSessionCacheString('lightenedColors', '#ff0000', 'rgb(255, 0, 0)');

    jest.advanceTimersByTime(CHAT_SESSION_CACHE_TTL_MS + 1);

    expect(getSessionCacheString('lightenedColors', '#ff0000')).toBeUndefined();
    expect(chatStore$.sessionCaches.lightenedColors.peek()).toEqual({});

    jest.useRealTimers();
  });

  test('trims expired entries when inserting new values', () => {
    jest.useFakeTimers();
    setSessionCacheString('mentionColors', 'first', '#111111');
    jest.advanceTimersByTime(CHAT_SESSION_CACHE_TTL_MS + 1);
    setSessionCacheString('mentionColors', 'second', '#222222');

    expect(getSessionCacheString('mentionColors', 'first')).toBeUndefined();
    expect(getSessionCacheString('mentionColors', 'second')).toBe('#222222');

    jest.useRealTimers();
  });

  test('clearMentionSessionCaches clears mention color buckets', () => {
    setSessionCacheString('mentionColors', 'luke', '#ffffff');
    setSessionCacheString('lightenedColors', '#ff0000', 'rgb(255, 0, 0)');

    clearMentionSessionCaches();

    expect(chatStore$.sessionCaches.mentionColors.peek()).toEqual({});
    expect(chatStore$.sessionCaches.lightenedColors.peek()).toEqual({});
  });
});

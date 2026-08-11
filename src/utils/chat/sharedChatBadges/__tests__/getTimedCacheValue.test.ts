import { getTimedCacheValue, setTimedCacheValue } from '../getTimedCacheValue';
import type { TimedCacheEntry } from '../types';

describe('getTimedCacheValue / setTimedCacheValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns a stored value before its ttl elapses', () => {
    const cache = new Map<string, TimedCacheEntry<string>>();
    setTimedCacheValue(cache, 'a', 'value-a', 1_000, 10);

    expect(getTimedCacheValue(cache, 'a')).toBe('value-a');
  });

  test('drops a value once its ttl elapses', () => {
    const cache = new Map<string, TimedCacheEntry<string>>();
    setTimedCacheValue(cache, 'a', 'value-a', 1_000, 10);

    jest.setSystemTime(1_000);

    expect(getTimedCacheValue(cache, 'a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  test('sweeps expired entries on write', () => {
    const cache = new Map<string, TimedCacheEntry<string>>();
    setTimedCacheValue(cache, 'a', 'value-a', 1_000, 10);

    jest.setSystemTime(2_000);
    setTimedCacheValue(cache, 'b', 'value-b', 1_000, 10);

    expect(cache.has('a')).toBe(false);
    expect(getTimedCacheValue(cache, 'b')).toBe('value-b');
  });

  test('evicts oldest entries past the size bound', () => {
    const cache = new Map<string, TimedCacheEntry<number>>();
    setTimedCacheValue(cache, 'a', 1, 60_000, 2);
    setTimedCacheValue(cache, 'b', 2, 60_000, 2);
    setTimedCacheValue(cache, 'c', 3, 60_000, 2);

    expect(cache.size).toBe(2);
    expect(getTimedCacheValue(cache, 'a')).toBeUndefined();
    expect(getTimedCacheValue(cache, 'b')).toBe(2);
    expect(getTimedCacheValue(cache, 'c')).toBe(3);
  });
});

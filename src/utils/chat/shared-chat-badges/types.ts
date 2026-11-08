export interface TimedCacheEntry<T> {
  value: T;
  expiresAt: number;
}

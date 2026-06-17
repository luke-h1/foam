jest.mock('expo-image', () => ({
  Image: { loadAsync: jest.fn(() => Promise.resolve({})) },
}));

import {
  clearCachedEmoteRefs,
  getCachedEmoteRef,
  subscribeCachedEmoteRef,
} from '@app/Providers/CachedEmotesProvider/cache-service';

describe('cache-service', () => {
  afterEach(() => {
    clearCachedEmoteRefs();
  });

  test('clearing the cache notifies subscribers so mounted rows drop the dangling ref', () => {
    const url = 'https://cdn.7tv.app/emote/abc/2x.avif';
    const onChange = jest.fn();
    subscribeCachedEmoteRef(url, onChange);

    clearCachedEmoteRefs();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getCachedEmoteRef(url)).toBeNull();
  });

  test('subscribers that have unsubscribed are not notified on clear', () => {
    const url = 'https://cdn.7tv.app/emote/def/2x.avif';
    const onChange = jest.fn();
    const unsubscribe = subscribeCachedEmoteRef(url, onChange);

    unsubscribe();
    clearCachedEmoteRefs();

    expect(onChange).not.toHaveBeenCalled();
  });
});

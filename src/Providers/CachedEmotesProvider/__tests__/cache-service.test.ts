jest.mock('expo-image', () => ({
  Image: { loadAsync: jest.fn(() => Promise.resolve({})) },
}));

import { Image, type ImageRef } from 'expo-image';
import {
  clearCachedEmoteRefs,
  ensureCachedEmoteRef,
  getCachedEmoteRef,
  subscribeCachedEmoteRef,
} from '@app/Providers/CachedEmotesProvider/cache-service';

const loadAsync = jest.mocked(Image.loadAsync);

const flushMicrotasks = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

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

  test('a decode in flight when the cache is cleared cannot repopulate it afterwards', async () => {
    const url = 'https://cdn.7tv.app/emote/ghi/2x.avif';
    let resolveDecode: (ref: ImageRef) => void = () => {};
    loadAsync.mockReturnValueOnce(
      new Promise<ImageRef>(resolve => {
        resolveDecode = resolve;
      }),
    );
    const onChange = jest.fn();
    subscribeCachedEmoteRef(url, onChange);

    ensureCachedEmoteRef(url);
    clearCachedEmoteRefs();
    onChange.mockClear();

    resolveDecode({} as ImageRef);
    await flushMicrotasks();

    expect(getCachedEmoteRef(url)).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});

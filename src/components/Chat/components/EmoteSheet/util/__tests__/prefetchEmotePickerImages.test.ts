import { Image as ExpoImage } from 'expo-image';

import { createMenuEmote } from '@app/components/Chat/components/EmoteSheet/__tests__/__fixtures__/emoteMenuData.fixture';

import { getEmotePickerDisplayUrl } from '../emotePickerDisplayUrl';
import { prefetchEmotePickerImages } from '../prefetchEmotePickerImages';

jest.mock('expo-image', () => ({
  Image: {
    prefetch: jest.fn().mockResolvedValue(true),
  },
}));

const prefetchMock = jest.mocked(ExpoImage.prefetch);

const warmedUrls = () =>
  prefetchMock.mock.calls.flatMap(([urls]) =>
    Array.isArray(urls) ? urls : [urls],
  );

beforeEach(() => {
  prefetchMock.mockClear();
});

describe('prefetchEmotePickerImages', () => {
  test('warms the picker display URL into expo-image memory-disk cache', async () => {
    const emote = createMenuEmote('warm-1', 'warm-1', '7TV Global');

    await prefetchEmotePickerImages([emote]);

    expect(warmedUrls()).toEqual([getEmotePickerDisplayUrl(emote)]);
    expect(prefetchMock).toHaveBeenCalledWith(
      [getEmotePickerDisplayUrl(emote)],
      'memory-disk',
    );
  });

  test('deduplicates emotes that resolve to the same URL', async () => {
    const emote = createMenuEmote('warm-2', 'warm-2', '7TV Global');

    await prefetchEmotePickerImages([emote, emote]);

    expect(warmedUrls()).toEqual([getEmotePickerDisplayUrl(emote)]);
  });

  test('does nothing when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await prefetchEmotePickerImages(
      [createMenuEmote('warm-3', 'warm-3', '7TV Global')],
      controller.signal,
    );

    expect(prefetchMock).not.toHaveBeenCalled();
  });
});

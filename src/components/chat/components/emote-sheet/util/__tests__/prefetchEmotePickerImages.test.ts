import { Image as ExpoImage } from 'expo-image';

import { createMenuEmote } from '@app/components/chat/components/emote-sheet/__tests__/__fixtures__/emoteMenuData.fixture';

import { prefetchEmotePickerImages } from '../prefetchEmotePickerImages';

const prefetchMock = jest.spyOn(ExpoImage, 'prefetch').mockResolvedValue(true);

const warmedUrls = () =>
  prefetchMock.mock.calls.flatMap(([urls]) =>
    Array.isArray(urls) ? urls : [urls],
  );

beforeEach(() => {
  prefetchMock.mockClear();
});

describe('prefetchEmotePickerImages', () => {
  test('warms the picker display URL into the disk cache only', async () => {
    const emote = createMenuEmote('warm-1', 'warm-1', '7TV Global');

    await prefetchEmotePickerImages([emote]);

    expect(prefetchMock.mock.calls).toEqual([
      [['https://cdn.example.com/warm-1.webp'], 'disk'],
    ]);
  });

  test('deduplicates emotes that resolve to the same URL', async () => {
    const emote = createMenuEmote('warm-2', 'warm-2', '7TV Global');

    await prefetchEmotePickerImages([emote, emote]);

    expect(warmedUrls()).toEqual(['https://cdn.example.com/warm-2.webp']);
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

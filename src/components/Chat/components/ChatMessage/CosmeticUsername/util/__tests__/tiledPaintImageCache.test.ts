import { act, renderHook } from '@testing-library/react-native';

const mockFromUri = jest.fn();
const mockMakeImageFromEncoded = jest.fn();

jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    Data: {
      fromURI: (url: string) => mockFromUri(url),
    },
    Image: {
      MakeImageFromEncoded: (data: unknown) => mockMakeImageFromEncoded(data),
    },
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: { warn: jest.fn() },
  },
}));

import { useTiledPaintImage } from '../tiledPaintImageCache';

const fakeData = { dispose: jest.fn() };
const fakeImage = { width: () => 32 };

async function flush(): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

describe('useTiledPaintImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns the decoded image and shares one fetch across hooks', async () => {
    const url = 'https://cdn.7tv.app/paint/tile-shared.webp';
    mockFromUri.mockResolvedValue(fakeData);
    mockMakeImageFromEncoded.mockReturnValue(fakeImage);

    const first = renderHook(() => useTiledPaintImage(url));
    await flush();
    const second = renderHook(() => useTiledPaintImage(url));
    await flush();

    expect(first.result.current).toBe(fakeImage);
    expect(second.result.current).toBe(fakeImage);
    expect(mockFromUri).toHaveBeenCalledTimes(1);
  });

  test('retries a failed fetch only after the negative-cache delay', async () => {
    const url = 'https://cdn.7tv.app/paint/tile-fetch-fail.webp';
    mockFromUri.mockRejectedValueOnce(new Error('network'));

    const hook = renderHook(() => useTiledPaintImage(url));
    await flush();
    expect(hook.result.current).toBeNull();
    expect(mockFromUri).toHaveBeenCalledTimes(1);

    hook.rerender({});
    await flush();
    expect(mockFromUri).toHaveBeenCalledTimes(1);

    mockFromUri.mockResolvedValue(fakeData);
    mockMakeImageFromEncoded.mockReturnValue(fakeImage);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    hook.rerender({});
    await flush();

    expect(mockFromUri).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(fakeImage);
  });

  test('retries a decode failure only after the negative-cache delay', async () => {
    const url = 'https://cdn.7tv.app/paint/tile-decode-fail.webp';
    mockFromUri.mockResolvedValue(fakeData);
    mockMakeImageFromEncoded.mockReturnValueOnce(null);

    const hook = renderHook(() => useTiledPaintImage(url));
    await flush();
    expect(hook.result.current).toBeNull();
    expect(mockFromUri).toHaveBeenCalledTimes(1);

    hook.rerender({});
    await flush();
    expect(mockFromUri).toHaveBeenCalledTimes(1);

    mockMakeImageFromEncoded.mockReturnValue(fakeImage);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    hook.rerender({});
    await flush();

    expect(mockFromUri).toHaveBeenCalledTimes(2);
    expect(hook.result.current).toBe(fakeImage);
  });
});

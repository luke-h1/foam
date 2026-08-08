import { act, render, screen } from '@testing-library/react-native';
import type { ImageLoadEventData } from 'expo-image';

import { Image } from '../Image';
import { imageFileStore } from '../imageFileStore';

jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');

  return {
    Image: (props: Record<string, unknown>) => (
      <View testID='expo-image' {...props} />
    ),
  };
});

const REMOTE_URL = 'https://example.com/emote.webp';
const FILE_URL = 'file:///cache/chat-img-cache/emote.webp';

const originalStore = { ...imageFileStore };

const getCachedImageUriMock = jest.fn<string | null, unknown[]>();
const cacheImageFromUrlMock = jest.fn<Promise<string>, unknown[]>();

const expoImageProps = () =>
  screen.getByTestId('expo-image').props as {
    source: unknown;
    recyclingKey?: string;
    cachePolicy?: string;
    onLoad: (event: ImageLoadEventData) => void;
  };

describe('Image', () => {
  beforeEach(() => {
    imageFileStore.enabled = true;
    imageFileStore.getCachedImageUri =
      getCachedImageUriMock as typeof imageFileStore.getCachedImageUri;
    imageFileStore.cacheImageFromUrl =
      cacheImageFromUrlMock as typeof imageFileStore.cacheImageFromUrl;
    getCachedImageUriMock.mockReturnValue(null);
    cacheImageFromUrlMock.mockImplementation(
      () => new Promise<string>(() => {}),
    );
  });

  afterEach(() => {
    imageFileStore.enabled = originalStore.enabled;
    imageFileStore.getCachedImageUri = originalStore.getCachedImageUri;
    imageFileStore.cacheImageFromUrl = originalStore.cacheImageFromUrl;
  });

  test('swaps to the downloaded file uri when the remote source has not rendered yet', async () => {
    let resolveDownload: (uri: string) => void = () => {};
    cacheImageFromUrlMock.mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveDownload = resolve;
        }),
    );

    render(<Image source={REMOTE_URL} />);
    expect(expoImageProps().source).toBe(REMOTE_URL);

    await act(async () => {
      resolveDownload(FILE_URL);
    });

    expect(expoImageProps().source).toBe(FILE_URL);
  });

  test('never re-swaps a source the remote url already rendered', async () => {
    let resolveDownload: (uri: string) => void = () => {};
    cacheImageFromUrlMock.mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveDownload = resolve;
        }),
    );

    render(<Image source={REMOTE_URL} />);

    act(() => {
      expoImageProps().onLoad({} as ImageLoadEventData);
    });
    await act(async () => {
      resolveDownload(FILE_URL);
    });

    expect(expoImageProps().source).toBe(REMOTE_URL);
  });

  test('keys recycling on the original url even when serving the disk copy', () => {
    getCachedImageUriMock.mockReturnValue(FILE_URL);

    render(<Image source={REMOTE_URL} />);

    const props = expoImageProps();
    expect(props.source).toBe(FILE_URL);
    expect(props.recyclingKey).toBe(REMOTE_URL);
  });

  test('derives cachePolicy memory while the file cache owns persistence', () => {
    render(<Image source={REMOTE_URL} />);

    expect(expoImageProps().cachePolicy).toBe('memory');
  });

  test('leaves cachePolicy to expo-image when the file cache is off', () => {
    render(<Image source={REMOTE_URL} cacheToFile={false} />);

    expect(expoImageProps().cachePolicy).toBeUndefined();
  });

  test('an explicit cachePolicy wins over the memory derivation', () => {
    render(<Image source={REMOTE_URL} cachePolicy='memory-disk' />);

    expect(expoImageProps().cachePolicy).toBe('memory-disk');
  });
});

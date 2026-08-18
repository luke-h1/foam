import { act, render, screen } from '@testing-library/react-native';
import type {
  ImageLoadEventData,
  ImageProps as ExpoImageProps,
} from 'expo-image';

import { Image } from '../Image';
import { imageFileStore } from '../imageFileStore';

const REMOTE_URL = 'https://example.com/emote.webp';
const FILE_URL = 'file:///cache/chat-img-cache/emote.webp';

const LOAD_EVENT: ImageLoadEventData = {
  cacheType: 'none',
  source: {
    url: REMOTE_URL,
    width: 32,
    height: 32,
    mediaType: 'image/webp',
  },
};

const originalStore = { ...imageFileStore };

const getCachedImageUriMock = jest.fn<
  ReturnType<typeof imageFileStore.getCachedImageUri>,
  Parameters<typeof imageFileStore.getCachedImageUri>
>();
const cacheImageFromUrlMock = jest.fn<
  ReturnType<typeof imageFileStore.cacheImageFromUrl>,
  Parameters<typeof imageFileStore.cacheImageFromUrl>
>();

type RenderedExpoImageProps = {
  source: ExpoImageProps['source'];
  recyclingKey: ExpoImageProps['recyclingKey'];
  cachePolicy: ExpoImageProps['cachePolicy'];
  onLoad: (event: ImageLoadEventData) => void;
};

const expoImageProp = <K extends keyof RenderedExpoImageProps>(
  key: K,
): RenderedExpoImageProps[K] => screen.getByTestId('expo-image').props[key];

describe('Image', () => {
  beforeEach(() => {
    imageFileStore.enabled = true;
    imageFileStore.getCachedImageUri = getCachedImageUriMock;
    imageFileStore.cacheImageFromUrl = cacheImageFromUrlMock;
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
    expect(expoImageProp('source')).toBe(REMOTE_URL);

    await act(async () => {
      resolveDownload(FILE_URL);
    });

    expect(expoImageProp('source')).toBe(FILE_URL);
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
      expoImageProp('onLoad')(LOAD_EVENT);
    });
    await act(async () => {
      resolveDownload(FILE_URL);
    });

    expect(expoImageProp('source')).toBe(REMOTE_URL);
  });

  test('keys recycling on the original url even when serving the disk copy', () => {
    getCachedImageUriMock.mockReturnValue(FILE_URL);

    render(<Image source={REMOTE_URL} />);

    expect(expoImageProp('source')).toBe(FILE_URL);
    expect(expoImageProp('recyclingKey')).toBe(REMOTE_URL);
  });

  test('derives cachePolicy memory while the file cache owns persistence', () => {
    render(<Image source={REMOTE_URL} />);

    expect(expoImageProp('cachePolicy')).toBe('memory');
  });

  test('leaves cachePolicy to expo-image when the file cache is off', () => {
    render(<Image source={REMOTE_URL} cacheToFile={false} />);

    expect(expoImageProp('cachePolicy')).toBeUndefined();
  });

  test('an explicit cachePolicy wins over the memory derivation', () => {
    render(<Image source={REMOTE_URL} cachePolicy='memory-disk' />);

    expect(expoImageProp('cachePolicy')).toBe('memory-disk');
  });
});

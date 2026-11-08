import { act, render } from '@testing-library/react-native';

import { Image } from '../Image.web';
import { imageFileStore } from '../util/imageFileStore';

describe('Image (web)', () => {
  const originalEnabled = imageFileStore.enabled;

  afterEach(() => {
    imageFileStore.enabled = originalEnabled;
    jest.restoreAllMocks();
  });

  test('does not revoke the cached blob URL when it unmounts before the download finishes', async () => {
    let finishDownload: (uri: string) => void = () => {};

    imageFileStore.enabled = true;
    jest.spyOn(imageFileStore, 'getCachedImageUri').mockReturnValue(null);

    const download = jest
      .spyOn(imageFileStore, 'cacheImageFromUrl')
      .mockReturnValue(
        new Promise(resolve => {
          finishDownload = resolve;
        }),
      );

    const revokeObjectURL = jest.fn();
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    const { unmount } = render(
      <Image source='https://static-cdn.jtvnw.net/emote.png' />,
    );

    expect(download).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      finishDownload('blob:https://app/shared');
    });

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});

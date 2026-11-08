import { fireEvent, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import * as ImageModule from '@app/components/image/Image';
import render from '@app/test/render';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { AssetPreviewSheet } from '../AssetPreviewSheet';

jest.spyOn(ImageModule, 'Image').mockImplementation(() => <></>);

const clipboardSetStringAsyncMock = jest
  .spyOn(Clipboard, 'setStringAsync')
  .mockResolvedValue(true);

const toastSuccessMock = jest.mocked(toast.success);

const emote = {
  type: 'emote',
  content: 'Dance',
  name: 'Dance',
  original_name: 'Dance',
  site: 'BTTV',
  url: 'https://example.com/animated-1x.webp',
  static_url: 'https://example.com/static-1x.webp',
  image_variants: {
    animated: {
      '2x': 'https://example.com/animated-2x.webp',
      '4x': 'https://example.com/animated-4x.webp',
    },
    static: {
      '4x': 'https://example.com/static-4x.webp',
    },
  },
} satisfies MessageToken<'emote'>;

const badge = {
  id: 'subscriber-12',
  provider: 'twitch',
  set: 'subscriber',
  title: 'Subscriber',
  type: 'Twitch Channel Badge',
  url: 'https://example.com/badge-4x.png',
} satisfies SanitisedBadgeSet;

describe('AssetPreviewSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('copies the emote URL from the image variants', async () => {
    const { getByText } = render(
      <AssetPreviewSheet kind='emote' asset={emote} onDismiss={jest.fn()} />,
    );

    fireEvent.press(getByText('Copy emote URL'));

    await waitFor(() => {
      expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
        'https://example.com/animated-4x.webp',
      );
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Emote URL copied');
  });

  test('copies the badge name', async () => {
    const { getByText } = render(
      <AssetPreviewSheet kind='badge' asset={badge} onDismiss={jest.fn()} />,
    );

    fireEvent.press(getByText('Copy badge name'));

    await waitFor(() => {
      expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith('Subscriber');
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Badge name copied');
  });
});

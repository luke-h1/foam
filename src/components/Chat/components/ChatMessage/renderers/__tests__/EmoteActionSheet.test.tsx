import { Text } from 'react-native';

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { EmoteActionSheet } from '../EmoteActionSheet';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sonner-native', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@app/components/Image/Image', () => ({
  Image: () => null,
}));

const clipboardSetStringAsyncMock = jest.mocked(Clipboard.setStringAsync);
const toastSuccessMock = jest.mocked(toast.success);

const part = {
  type: 'emote',
  content: 'Dance',
  name: 'Dance',
  original_name: 'Dance',
  creator: 'artist',
  site: 'BTTV',
  url: 'https://example.com/animated-4x.webp',
  static_url: 'https://example.com/static-4x.webp',
  image_variants: {
    animated: {
      '2x': 'https://example.com/animated-2x.webp',
      '4x': 'https://example.com/animated-4x.webp',
    },
    static: {
      '2x': 'https://example.com/static-2x.webp',
      '4x': 'https://example.com/static-4x.webp',
    },
  },
} satisfies ParsedPart<'emote'>;

const partWithoutStructuredVariants = {
  type: 'emote',
  content: 'Kappa',
  name: 'Kappa',
  original_name: 'Kappa',
  creator: 'twitch',
  site: 'Twitch Global',
  url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
  static_url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/1.0',
} satisfies ParsedPart<'emote'>;

describe('EmoteActionSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('copies scaled animated emote URLs from image variants', async () => {
    const { getByText } = render(
      <EmoteActionSheet part={part}>
        <Text>Dance trigger</Text>
      </EmoteActionSheet>,
    );

    fireEvent(getByText('Dance trigger'), 'longPress', {
      preventDefault: jest.fn(),
    });
    fireEvent.press(getByText('Copy 2x image URL'));

    await waitFor(() => {
      expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
        'https://example.com/animated-2x.webp',
      );
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      '2x emote URL copied to clipboard',
    );
  });

  test('copies static scaled URLs when animations are disabled', async () => {
    const { getByText } = render(
      <EmoteActionSheet part={part} disableAnimations>
        <Text>Dance trigger</Text>
      </EmoteActionSheet>,
    );

    fireEvent(getByText('Dance trigger'), 'longPress', {
      preventDefault: jest.fn(),
    });
    fireEvent.press(getByText('Copy 4x image URL'));

    await waitFor(() => {
      expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
        'https://example.com/static-4x.webp',
      );
    });
  });

  test('derives scaled copy actions from known emote CDN URLs', async () => {
    const { getByText } = render(
      <EmoteActionSheet part={partWithoutStructuredVariants}>
        <Text>Kappa trigger</Text>
      </EmoteActionSheet>,
    );

    fireEvent(getByText('Kappa trigger'), 'longPress', {
      preventDefault: jest.fn(),
    });

    expect(getByText('Copy 2x image URL')).toBeOnTheScreen();
    fireEvent.press(getByText('Copy 4x image URL'));

    await waitFor(() => {
      expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
        'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
      );
    });
  });

  test('passes the displayed emote variant to preview handlers', () => {
    const onPreview = jest.fn();
    const { getByText } = render(
      <EmoteActionSheet part={part} disableAnimations onPress={onPreview}>
        <Text>Dance trigger</Text>
      </EmoteActionSheet>,
    );

    fireEvent(getByText('Dance trigger'), 'longPress', {
      preventDefault: jest.fn(),
    });
    fireEvent.press(getByText('Preview'));

    expect(onPreview.mock.calls[0]?.[0]?.url).toEqual(
      'https://example.com/static-4x.webp',
    );
  });
});

import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  buildEmoteMenuActions,
  createEmoteMenuActionHandler,
  EMOTE_MENU_ACTION_IDS,
} from '../buildEmoteMenuActions';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sonner-native', () => ({
  toast: {
    success: jest.fn(),
  },
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

describe('buildEmoteMenuActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('includes scaled animated copy actions from image variants', () => {
    const actions = buildEmoteMenuActions({
      part,
      disableAnimations: false,
      includePreview: false,
    });

    expect(actions.map(action => action.id)).toEqual([
      EMOTE_MENU_ACTION_IDS.copyName,
      EMOTE_MENU_ACTION_IDS.copyUrl,
      'copy-emote-url-2x',
      'copy-emote-url-4x',
    ]);
  });

  test('copies scaled animated emote URLs from image variants', async () => {
    const handler = createEmoteMenuActionHandler({
      part,
      disableAnimations: false,
    });

    handler('copy-emote-url-2x');

    await Promise.resolve();

    expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
      'https://example.com/animated-2x.webp',
    );
    expect(toastSuccessMock).toHaveBeenCalledWith(
      '2x emote URL copied to clipboard',
    );
  });

  test('copies static scaled URLs when animations are disabled', async () => {
    const handler = createEmoteMenuActionHandler({
      part,
      disableAnimations: true,
    });

    handler('copy-emote-url-4x');

    await Promise.resolve();

    expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
      'https://example.com/static-4x.webp',
    );
  });

  test('derives scaled copy actions from known emote CDN URLs', async () => {
    const actions = buildEmoteMenuActions({
      part: partWithoutStructuredVariants,
      disableAnimations: false,
      includePreview: false,
    });

    expect(actions.map(action => action.id)).toEqual([
      EMOTE_MENU_ACTION_IDS.copyName,
      EMOTE_MENU_ACTION_IDS.copyUrl,
      'copy-emote-url-2x',
      'copy-emote-url-4x',
    ]);

    const handler = createEmoteMenuActionHandler({
      part: partWithoutStructuredVariants,
      disableAnimations: false,
    });

    handler('copy-emote-url-4x');

    await Promise.resolve();

    expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
      'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
    );
  });

  test('passes the displayed emote variant to preview handlers', () => {
    const onPreview = jest.fn();
    const handler = createEmoteMenuActionHandler({
      part,
      disableAnimations: true,
      onPreview,
    });

    handler(EMOTE_MENU_ACTION_IDS.preview);

    expect(onPreview.mock.calls[0]?.[0]?.url).toEqual(
      'https://example.com/static-4x.webp',
    );
  });
});

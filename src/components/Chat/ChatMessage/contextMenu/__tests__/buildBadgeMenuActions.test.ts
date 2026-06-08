import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import {
  BADGE_MENU_ACTION_IDS,
  buildBadgeMenuActions,
  createBadgeMenuActionHandler,
} from '../buildBadgeMenuActions';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sonner-native', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@app/utils/browser/openLinkInBrowser', () => ({
  openLinkInBrowser: jest.fn().mockResolvedValue(undefined),
}));

const clipboardSetStringAsyncMock = jest.mocked(Clipboard.setStringAsync);
const toastSuccessMock = jest.mocked(toast.success);
const openLinkInBrowserMock = jest.mocked(openLinkInBrowser);

const badge = {
  id: '12',
  set: 'subscriber',
  title: 'Subscriber',
  type: 'subscriber',
  url: 'https://example.com/badge.png',
} satisfies SanitisedBadgeSet;

describe('buildBadgeMenuActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('includes copy and open-in-browser actions', () => {
    const actions = buildBadgeMenuActions(badge);

    expect(actions.map(action => action.id)).toEqual([
      BADGE_MENU_ACTION_IDS.copyName,
      BADGE_MENU_ACTION_IDS.copyUrl,
      BADGE_MENU_ACTION_IDS.openInBrowser,
    ]);
  });

  test('copies badge name and URL', async () => {
    const handler = createBadgeMenuActionHandler(badge);

    handler(BADGE_MENU_ACTION_IDS.copyName);
    await Promise.resolve();
    expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith('Subscriber');
    expect(toastSuccessMock).toHaveBeenCalledWith('Badge name copied');

    handler(BADGE_MENU_ACTION_IDS.copyUrl);
    await Promise.resolve();
    expect(clipboardSetStringAsyncMock).toHaveBeenCalledWith(
      'https://example.com/badge.png',
    );
    expect(toastSuccessMock).toHaveBeenCalledWith('Badge URL copied');
  });

  test('opens badge URL in browser', async () => {
    const handler = createBadgeMenuActionHandler(badge);

    await handler(BADGE_MENU_ACTION_IDS.openInBrowser);

    expect(openLinkInBrowserMock).toHaveBeenCalledWith(
      'https://example.com/badge.png',
    );
  });
});

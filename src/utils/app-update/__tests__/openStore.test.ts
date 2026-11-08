import { toast } from 'sonner-native';

import * as GetStoreUrl from '@app/utils/app-update/getStoreUrlAsync';
import * as OpenLink from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';

import { openStore } from '../openStore';

describe('openStore', () => {
  beforeEach(() => {
    jest.spyOn(logger.main, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the store URL', async () => {
    jest
      .spyOn(GetStoreUrl, 'getStoreUrlAsync')
      .mockResolvedValue('https://apps.apple.com/app/id1');

    const open = jest
      .spyOn(OpenLink, 'openLinkInBrowserAsync')
      .mockResolvedValue();

    await openStore();

    expect(open.mock.calls).toEqual([['https://apps.apple.com/app/id1']]);

    expect(toast.error).not.toHaveBeenCalled();
  });

  test('shows a toast instead of rejecting when the store lookup throws', async () => {
    jest
      .spyOn(GetStoreUrl, 'getStoreUrlAsync')
      .mockRejectedValue(new Error('lookup failed'));

    await expect(openStore()).resolves.toBeUndefined();

    expect(jest.mocked(toast.error).mock.calls).toEqual([
      ['Could not open the store'],
    ]);
  });

  test('shows a toast when the platform has no store', async () => {
    jest.spyOn(GetStoreUrl, 'getStoreUrlAsync').mockResolvedValue(null);

    await openStore();

    expect(jest.mocked(toast.error).mock.calls).toEqual([
      ['Could not open the store'],
    ]);
  });
});

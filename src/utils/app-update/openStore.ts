import { toast } from 'sonner-native';

import { openLinkInBrowserAsync } from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';

import { getStoreUrlAsync } from './getStoreUrlAsync';

/**
 * Opens the store page for this build. Never rejects: a failure shows a toast.
 */
export async function openStore(): Promise<void> {
  try {
    const storeUrl = await getStoreUrlAsync();

    if (!storeUrl) {
      toast.error('Could not open the store');
      return;
    }

    await openLinkInBrowserAsync(storeUrl);
  } catch (error) {
    logger.main.error('[openStore] failed to open store link', error);
    toast.error('Could not open the store');
  }
}

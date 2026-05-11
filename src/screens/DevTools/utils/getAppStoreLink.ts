import { storageService } from '@app/lib/storage';
import { fetch } from 'expo/fetch';

type AppStoreLookupResponse = {
  resultCount: number;
  results: Array<{
    trackId?: number | string;
  }>;
};

export async function getAppStoreLink(bundleId: string) {
  const cachedLink = storageService.getString<string>(
    `appStoreLink_${bundleId}`,
  );
  if (cachedLink) {
    return cachedLink;
  }

  const response = await fetch(
    `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to query App Store URL. Status: ${response.status}`,
    );
  }

  const data = (await response.json()) as AppStoreLookupResponse;

  if (data.resultCount === 0 || !data.results[0]?.trackId) {
    throw new Error(`No app found for bundle ID on App Store: ${bundleId}`);
  }

  const appId = data.results[0].trackId;
  const appStoreLink = `https://apps.apple.com/app/id${appId}`;

  storageService.set(`appStoreLink_${bundleId}`, appStoreLink);

  return appStoreLink;
}

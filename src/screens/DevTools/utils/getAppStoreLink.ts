import { storageService } from '@app/services/storage-service';
import { fetch } from 'expo/fetch';

export async function getAppStoreLink(bundleId: string) {
  // Check cache first
  const cachedLink = storageService.getString<string>(
    `appStoreLink_${bundleId}`,
  );
  if (cachedLink) {
    console.log(`Returning cached App Store link for ${bundleId}`);
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await response.json();
  console.log('data', data);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (data.resultCount === 0 || !data.results[0]?.trackId) {
    throw new Error(`No app found for bundle ID on App Store: ${bundleId}`);
  }

  // Extract App ID and construct App Store link
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const appId = data.results[0].trackId as string;
  const appStoreLink = `https://apps.apple.com/app/id${appId}`;

  // Cache the successful result
  storageService.set(`appStoreLink_${bundleId}`, appStoreLink);

  return appStoreLink;
}

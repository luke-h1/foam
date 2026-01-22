import { sentryService } from '@app/services/sentry-service';
import { nativeBuildVersion } from 'expo-application';
import * as Updates from 'expo-updates';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  setUpdateRequestHeadersOverride,
  setUpdateURLAndRequestHeadersOverride,
} from 'expo-updates';
import { Platform } from 'react-native';

/**
 * Switches the update channel at runtime and optionally fetches updates from the new channel.
 *
 * After switching channels, the app will fetch updates from the new channel on the next
 * update check or app launch.
 *
 * @param channelName - The name of the channel to switch to (e.g., 'production', 'preview', 'staging')
 * @param fetchImmediately - If true, immediately check for and fetch updates from the new channel
 * @returns Promise that resolves when the channel switch (and optional fetch) is complete
 */
export async function switchUpdateChannel(
  channelName: string,
  fetchImmediately = false,
): Promise<void> {
  if (!Updates.isEnabled) {
    throw new Error('Updates are not enabled');
  }

  const previousChannel = Updates.channel || 'unknown';

  sentryService.addBreadcrumb({
    category: 'ota',
    message: `Switching update channel: ${previousChannel} → ${channelName}`,
    level: 'info',
    data: {
      previousChannel,
      newChannel: channelName,
      fetchImmediately,
    },
  });

  setUpdateRequestHeadersOverride({
    'expo-channel-name': channelName,
  });

  sentryService.captureMessage('OTA channel switched', {
    level: 'info',
    tags: {
      category: 'ota',
      action: 'channel_switch',
    },
    extra: {
      previousChannel,
      newChannel: channelName,
      buildVersion: nativeBuildVersion,
      platform: Platform.OS,
    },
  });

  if (fetchImmediately) {
    sentryService.addBreadcrumb({
      category: 'ota',
      message: 'Checking for updates from new channel',
      level: 'info',
      data: {
        channel: channelName,
      },
    });

    try {
      const result = await checkForUpdateAsync();
      if (result.isAvailable) {
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Update available from new channel, fetching...',
          level: 'info',
          data: {
            channel: channelName,
            manifestId: result.manifest?.id,
          },
        });

        await fetchUpdateAsync();

        sentryService.captureMessage('OTA update fetched from new channel', {
          level: 'info',
          tags: {
            category: 'ota',
            action: 'channel_switch_fetch',
          },
          extra: {
            channel: channelName,
            manifestId: result.manifest?.id,
          },
        });
      } else {
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'No update available from new channel',
          level: 'info',
          data: {
            channel: channelName,
          },
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      sentryService.captureException(err, {
        tags: {
          category: 'ota',
          action: 'channel_switch_fetch_error',
        },
        extra: {
          channel: channelName,
          previousChannel,
        },
      });
      throw err;
    }
  }
}

/**
 * Overrides both the update URL and request headers at runtime.
 *
 * This allows loading a specific update by ID, even if the update was published
 * before the current build was created. This feature requires
 * `disableAntiBrickingMeasures` to be enabled in app.config.ts.
 *
 * ⚠️ SECURITY WARNING: This feature disables anti-bricking measures. Only use
 * in preview builds, not production. After calling this, the user MUST close
 * and reopen the app completely (not just background it) for the change to take effect.
 *
 * @param url - The update URL to override to (e.g., 'https://u.expo.dev/{projectId}/group/{groupId}')
 * @param requestHeaders - Optional request headers to override (e.g., { 'expo-channel-name': 'preview' })
 * @returns Promise that resolves when the override is set
 *
 * @example
 * ```ts
 * // Override to a specific update URL
 * await overrideUpdateURLAndHeaders(
 *   'https://u.expo.dev/950a1e2f-6b25-4be7-adb2-3c16287a2b5e/group/abc123',
 *   { 'expo-channel-name': 'preview' }
 * );
 * ```
 */
export function overrideUpdateURLAndHeaders(
  url: string,
  requestHeaders: Record<string, string> = {},
): void {
  if (!Updates.isEnabled) {
    throw new Error('Updates are not enabled');
  }

  const previousChannel = Updates.channel || 'unknown';

  sentryService.addBreadcrumb({
    category: 'ota',
    message: `Overriding update URL and headers: ${url}`,
    level: 'info',
    data: {
      newURL: url,
      previousChannel,
      newHeaders: requestHeaders,
    },
  });

  setUpdateURLAndRequestHeadersOverride({
    updateUrl: url,
    requestHeaders,
  });

  sentryService.captureMessage('OTA URL and headers overridden', {
    level: 'info',
    tags: {
      category: 'ota',
      action: 'url_override',
    },
    extra: {
      newURL: url,
      previousChannel,
      newHeaders: requestHeaders,
      buildVersion: nativeBuildVersion,
      platform: Platform.OS,
    },
  });
}

import '@react-native-firebase/installations';

import {
  getAnalytics,
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties,
} from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

import { logger } from '@app/utils/logger';

const analytics = getAnalytics(getApp());

export interface AnalyticsUser {
  id: string;
  twitchLogin?: string;
  twitchDisplayName?: string;
}

/**
 * Turns Firebase Analytics collection on or off. This is the single privacy
 * gate: when disabled the SDK drops every event, so callers of the log helpers
 * below never need to check the preference themselves.
 */
export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  try {
    await setAnalyticsCollectionEnabled(analytics, enabled);
  } catch (error) {
    logger.main.warn('Failed to toggle analytics collection', error);
  }
}

export async function setAnalyticsUser(user: AnalyticsUser): Promise<void> {
  try {
    await setUserId(analytics, user.id);
    await setUserProperties(analytics, {
      twitchLogin: user.twitchLogin ?? null,
      twitchDisplayName: user.twitchDisplayName ?? null,
    });
  } catch (error) {
    logger.main.warn('Failed to set analytics user', error);
  }
}

export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await logEvent(analytics, name, params);
  } catch (error) {
    logger.main.warn('Failed to log analytics event', error);
  }
}

export async function logAnalyticsScreenView(
  screenName: string,
): Promise<void> {
  try {
    await logScreenView(analytics, {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    logger.main.warn('Failed to log analytics screen view', error);
  }
}

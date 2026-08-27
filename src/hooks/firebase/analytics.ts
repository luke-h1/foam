import '@react-native-firebase/installations';

import {
  getAnalytics,
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

import { logger } from '@app/utils/logger';

import type {
  AnalyticsEventName,
  AnalyticsEventParams,
} from './analyticsEvents';

const analytics = getAnalytics(getApp());

/**
 * The single privacy gate: when disabled the SDK drops every event, so the log helpers never re-check the preference.
 */
export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  try {
    await setAnalyticsCollectionEnabled(analytics, enabled);
  } catch (error) {
    logger.main.warn('Failed to toggle analytics collection', error);
  }
}

/**
 * Logs an allow-listed event from analyticsEvents.ts; an unlisted name or wrong param shape fails to compile.
 */
export async function logAnalyticsEvent<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventParams[K],
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

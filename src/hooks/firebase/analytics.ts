import '@react-native-firebase/installations';

import {
  getAnalytics,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

import { logger } from '@app/utils/logger';

const analytics = getAnalytics(getApp());

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  try {
    await setAnalyticsCollectionEnabled(analytics, enabled);
  } catch (error) {
    logger.main.warn('Failed to toggle analytics collection', error);
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

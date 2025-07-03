import * as Application from 'expo-application';
import { getAppStoreLink } from './getAppStoreLink';

export async function getStoreUrlAsync() {
  if (process.env.EXPO_OS === 'ios') {
    return getAppStoreLink(Application.applicationId as string);
  }
  if (process.env.EXPO_OS === 'android') {
    return `https://play.google.com/store/apps/details?id=${Application.applicationId}`;
  }
  return null;
}

import type {
  AnalyticsEventName,
  AnalyticsEventParams,
} from './analyticsEvents';

export interface AnalyticsUser {
  id: string;
  twitchLogin?: string;
  twitchDisplayName?: string;
}

export async function setAnalyticsEnabled(_enabled: boolean): Promise<void> {}

export async function setAnalyticsUser(_user: AnalyticsUser): Promise<void> {}

export async function logAnalyticsEvent<K extends AnalyticsEventName>(
  _name: K,
  _params: AnalyticsEventParams[K],
): Promise<void> {}

export async function logAnalyticsScreenView(
  _screenName: string,
): Promise<void> {}

export interface AnalyticsUser {
  id: string;
  twitchLogin?: string;
  twitchDisplayName?: string;
}

export async function setAnalyticsEnabled(_enabled: boolean): Promise<void> {}

export async function setAnalyticsUser(_user: AnalyticsUser): Promise<void> {}

export async function logAnalyticsEvent(
  _name: string,
  _params?: Record<string, string | number | boolean>,
): Promise<void> {}

export async function logAnalyticsScreenView(
  _screenName: string,
): Promise<void> {}

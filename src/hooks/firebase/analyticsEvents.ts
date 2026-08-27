/**
 * Allow-list of custom analytics events; `logAnalyticsEvent` accepts only these keys. Names follow GA4 rules (snake_case, <=40 chars, not reserved), params must be primitives, and reserved `screen_view` goes through `logAnalyticsScreenView`.
 */
export interface AnalyticsEventParams {
  experiment_exposure: { experiment: string; variant: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

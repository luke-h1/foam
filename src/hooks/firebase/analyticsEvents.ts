/**
 * The allow-list of custom analytics events, keyed by name with each event's
 * params. `logAnalyticsEvent` only accepts these keys, so an unlisted name or
 * wrong param shape fails to compile. Names follow GA4 rules (snake_case, <=40
 * chars, not reserved) and params must be primitives. `screen_view` is reserved
 * and goes through `logAnalyticsScreenView`, not this map.
 */
export interface AnalyticsEventParams {
  experiment_exposure: { experiment: string; variant: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

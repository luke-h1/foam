export interface AnalyticsEventParams {
  experiment_exposure: { experiment: string; variant: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

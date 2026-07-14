/**
 * The allow-list of custom analytics events, keyed by name with each event's
 * params. `logAnalyticsEvent` only accepts these keys, so an unlisted name or
 * wrong param shape fails to compile. Names follow GA4 rules (snake_case, <=40
 * chars, not reserved) and params must be primitives. `screen_view` is reserved
 * and goes through `logAnalyticsScreenView`, not this map.
 */
export interface AnalyticsEventParams {
  experiment_exposure: { experiment: string; variant: string };
  stream_opened: { channel: string; source: string };
  stream_play_started: { channel: string };
  clip_created: { channel: string };
  chat_message_sent: { channel: string };
  chat_emote_used: { channel: string; provider: string };
  login_completed: { method: string };
  search_performed: { query_length: number };
  setting_changed: { setting: string; value: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

/**
 * The allow-list grouped by product area, for docs and the dev-tools catalogue.
 */
export const ANALYTICS_EVENT_CATEGORIES = {
  experiment: ['experiment_exposure'],
  stream: ['stream_opened', 'stream_play_started', 'clip_created'],
  chat: ['chat_message_sent', 'chat_emote_used'],
  auth: ['login_completed'],
  discovery: ['search_performed'],
  settings: ['setting_changed'],
} satisfies Record<string, AnalyticsEventName[]>;

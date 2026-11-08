import type { ProviderId } from '@app/types/emote';

/**
 * The spelling Sentry tags and log metadata use for a provider. Dashboards
 * group on these values, so they stay as they were.
 */
export type ProviderMonitoringName =
  | 'twitch'
  | 'seven_tv'
  | 'bttv'
  | 'ffz'
  | 'chatterino'
  | 'stream_elements';

export interface ProviderDescriptor {
  id: ProviderId;
  shortName: string;
  fullName: string;
  logPrefix: 'api' | 'bttv' | 'ffz' | 'streamElements' | 'stv' | 'twitch';
  monitoringName: ProviderMonitoringName;
  exceptionName: string;
  errorName: `${ProviderMonitoringName}_api_error` | 'api_error';
}

export const PROVIDER_DESCRIPTORS = {
  twitch: {
    id: 'twitch',
    shortName: 'Twitch',
    fullName: 'Twitch',
    logPrefix: 'twitch',
    monitoringName: 'twitch',
    exceptionName: 'TwitchApiError',
    errorName: 'twitch_api_error',
  },
  '7tv': {
    id: '7tv',
    shortName: '7TV',
    fullName: '7TV',
    logPrefix: 'stv',
    monitoringName: 'seven_tv',
    exceptionName: 'SevenTVApiError',
    errorName: 'seven_tv_api_error',
  },
  bttv: {
    id: 'bttv',
    shortName: 'BTTV',
    fullName: 'BetterTTV',
    logPrefix: 'bttv',
    monitoringName: 'bttv',
    exceptionName: 'BTTVApiError',
    errorName: 'bttv_api_error',
  },
  ffz: {
    id: 'ffz',
    shortName: 'FFZ',
    fullName: 'FrankerFaceZ',
    logPrefix: 'ffz',
    monitoringName: 'ffz',
    exceptionName: 'FFZApiError',
    errorName: 'ffz_api_error',
  },
  chatterino: {
    id: 'chatterino',
    shortName: 'Chatterino',
    fullName: 'Chatterino',
    logPrefix: 'api',
    monitoringName: 'chatterino',
    exceptionName: 'ChatterinoApiError',
    errorName: 'api_error',
  },
  streamelements: {
    id: 'streamelements',
    shortName: 'StreamElements',
    fullName: 'StreamElements',
    logPrefix: 'streamElements',
    monitoringName: 'stream_elements',
    exceptionName: 'StreamElementsApiError',
    errorName: 'api_error',
  },
} as const satisfies Record<ProviderId, ProviderDescriptor>;

export const SEVEN_TV_GQL_BASE_URL = 'https://7tv.io/v4';

export const SEVEN_TV_GQL_PATH = '/gql';

/**
 * The full 7TV GQL endpoint, for code that matches requests by url (the
 * Sentry GraphQL integration).
 */
export const SEVEN_TV_GQL_URL = `${SEVEN_TV_GQL_BASE_URL}${SEVEN_TV_GQL_PATH}`;

/**
 * The emote set id that stands for 7TV's global set. The set-id lookup returns
 * it for a channel that has no 7TV set of its own.
 */
export const SEVEN_TV_GLOBAL_EMOTE_SET_ID = 'global';

import { logger } from '@app/utils/logger';
import {
  isFetchHttpError,
  type FetchClientResponse,
  type ResponseInterceptor,
} from '../Client';

export type AuthRefreshCallback = () => Promise<void>;

export const createAuthErrorInterceptor = (
  onAuthError: AuthRefreshCallback,
): ResponseInterceptor => ({
  onResponse: (response: FetchClientResponse) => response,
  onError: async (error: unknown) => {
    if (isFetchHttpError(error) && error.response?.status === 401) {
      const url = error.config?.url || '';
      const baseURL = error.config?.baseURL || '';

      if (baseURL.includes('api.twitch.tv') || url.includes('api.twitch.tv')) {
        logger.auth.warn(
          '401 Unauthorized from Twitch API, refreshing auth state',
          { url, baseURL },
        );

        try {
          await onAuthError();
          logger.auth.info('Auth state refreshed after 401');
        } catch (refreshError) {
          logger.auth.error(
            'Failed to refresh auth state after 401',
            refreshError,
          );
        }
      }
    }

    throw error;
  },
});

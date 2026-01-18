import { sentryService } from '@app/services/sentry-service';
import { logger } from '@app/utils/logger';
import { AxiosError, AxiosResponse } from 'axios';
import { ResponseInterceptor } from '../Client';

export type AuthRefreshCallback = () => Promise<void>;

/**
 * Creates a response interceptor that handles 401 Unauthorized errors
 * by triggering an auth refresh callback.
 *
 * This is particularly important after OTA updates when the app reloads
 * and auth state might not be fully restored before API calls are made.
 */
export const createAuthErrorInterceptor = (
  onAuthError: AuthRefreshCallback,
): ResponseInterceptor => ({
  onResponse: (response: AxiosResponse) => response,
  onError: async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      // Only handle 401s for Twitch API calls
      const url = error.config?.url || '';
      const baseURL = error.config?.baseURL || '';
      
      if (
        baseURL.includes('api.twitch.tv') ||
        url.includes('api.twitch.tv')
      ) {
        logger.auth.warn('401 Unauthorized from Twitch API, refreshing auth state', {
          url,
          baseURL,
        });

        sentryService.addBreadcrumb({
          category: 'auth',
          message: '401 Unauthorized - refreshing auth state',
          level: 'warning',
          data: {
            url,
            baseURL,
            reason: 'ota_update_or_token_expired',
          },
        });

        try {
          // Trigger auth refresh/re-auth
          // This will restore tokens from SecureStore or fetch new anon token
          await onAuthError();
          
          logger.auth.info('Auth state refreshed after 401');
          
          sentryService.addBreadcrumb({
            category: 'auth',
            message: 'Auth state refreshed successfully after 401',
            level: 'info',
          });
          
          // Note: We don't retry the request here because:
          // 1. The auth refresh might take time
          // 2. React Query will handle retries automatically
          // 3. The user might need to re-authenticate
        } catch (refreshError) {
          logger.auth.error('Failed to refresh auth state after 401', refreshError);
          
          sentryService.captureException(refreshError, {
            tags: {
              category: 'auth',
              action: 'refresh_failed_after_401',
            },
            extra: {
              originalUrl: url,
              baseURL,
            },
          });
          
          // If refresh fails, let the error propagate
          // The auth context will handle clearing tokens
        }
      }
    }
    
    // Re-throw the error so it can be handled by other error handlers
    throw error;
  },
});

import { recordError, recordInfo } from '@app/lib/sentry';
import { ResponseInterceptor, ResponseInterceptorFactory } from '../Client';

export const createTracingInterceptor: ResponseInterceptorFactory =
  (): ResponseInterceptor => ({
    onResponse: response => {
      const { config } = response;
      const url = `${config.baseURL || ''}${config.url || ''}`;

      if (response.status >= 400) {
        recordError({
          name: 'APIError',
          message: `HTTP request returned ${response.status}`,
          params: {
            category: 'API',
            action: 'response_error_status',
            method: config.method?.toUpperCase(),
            url,
            status: response.status,
          },
        });
      } else {
        recordInfo({
          name: 'APIInfo',
          message: `HTTP ${config.method?.toUpperCase()} ${url}`,
          params: {
            category: 'API',
            action: 'response_ok',
            method: config.method?.toUpperCase(),
            url,
            status: response.status,
          },
        });
      }

      return response;
    },
    onError: error => {
      recordError({
        name: 'NetworkError',
        message: 'HTTP request failed',
        params: {
          category: 'Network',
          action: 'http_request_failed',
        },
        errorCause: error,
      });
      throw error;
    },
  });

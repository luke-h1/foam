import { sentryService } from '@app/services/sentry-service';
import { ResponseInterceptor, ResponseInterceptorFactory } from '../Client';

export const createTracingInterceptor: ResponseInterceptorFactory =
  (): ResponseInterceptor => ({
    onResponse: response => {
      const { config } = response;
      const url = `${config.baseURL || ''}${config.url || ''}`;

      sentryService.addBreadcrumb({
        category: 'http',
        message: `${config.method?.toUpperCase()} ${url}`,
        data: {
          status: response.status,
          url,
        },
        level: response.status >= 400 ? 'error' : 'info',
      });

      return response;
    },
    onError: error => {
      sentryService.addBreadcrumb({
        category: 'http',
        message: 'HTTP request failed',
        level: 'error',
      });
      throw error;
    },
  });

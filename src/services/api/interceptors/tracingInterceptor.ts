import { recordError, recordInfo } from '@app/lib/sentry';
import { isAxiosError } from 'axios';
import { ResponseInterceptor, ResponseInterceptorFactory } from '../Client';
import { getApiMonitoringContext } from '../monitoring';

export const createTracingInterceptor: ResponseInterceptorFactory =
  (): ResponseInterceptor => ({
    onResponse: response => {
      const { config } = response;
      const context = getApiMonitoringContext({
        baseURL: config.baseURL,
        method: config.method,
        status: response.status,
        url: config.url,
      });

      if (response.status >= 400) {
        recordError({
          name: 'api_error',
          message: `HTTP request returned ${response.status}`,
          params: {
            action: 'response_error_status',
            category: 'api',
            ...context,
          },
        });
      } else {
        recordInfo({
          name: 'api_info',
          message: `HTTP ${context.method} ${context.endpoint}`,
          params: {
            action: 'response_ok',
            category: 'api',
            ...context,
          },
        });
      }

      return response;
    },
    onError: error => {
      const context = isAxiosError(error)
        ? getApiMonitoringContext({
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            status: error.response?.status,
            url: error.config?.url,
          })
        : {};

      recordError({
        name: 'network_error',
        message: 'HTTP request failed',
        params: {
          action: 'http_request_failed',
          category: 'network',
          ...context,
        },
        errorCause: error,
      });
      throw error;
    },
  });

import { recordError, recordInfo } from '@app/lib/sentry';
import {
  isFetchHttpError,
  type ResponseInterceptor,
  type ResponseInterceptorFactory,
} from '../Client';
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
      const context = isFetchHttpError(error)
        ? getApiMonitoringContext({
            baseURL: error.config.baseURL,
            method: error.config.method,
            status: error.response?.status,
            url: error.config.url,
          })
        : {};
      const isHttpError = isFetchHttpError(error) && !!error.response;

      recordError({
        name: isHttpError ? 'api_error' : 'network_error',
        message: isHttpError
          ? `HTTP request returned ${error.response?.status}`
          : 'HTTP request failed',
        params: {
          action: isHttpError ? 'response_error_status' : 'http_request_failed',
          category: isHttpError ? 'api' : 'network',
          ...context,
        },
        errorCause: error,
      });
      throw error;
    },
  });

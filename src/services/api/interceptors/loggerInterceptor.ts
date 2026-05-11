import { AllowedPrefix, logger } from '@app/utils/logger';
import { RequestInterceptor } from '../Client';
import { recordError } from '@app/lib/sentry';

export const createLoggerInterceptor = (
  prefix: AllowedPrefix,
): RequestInterceptor => ({
  onRequest: config => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { baseURL = '', url = '', params } = config;
    const logParams: Record<string, string | number | boolean> = {};

    if (params && typeof params === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.entries(params).forEach(([key, value]) => {
        logParams[key] = value as string | number | boolean;
      });
    }

    const trimmedBase = baseURL.replace(/\/+$/, '');
    const trimmedUrl = url.replace(/^\/+/, '');
    const fullPath = `${trimmedBase}/${trimmedUrl}`;

    const urlObject = new URL(fullPath);
    Object.entries(logParams).forEach(([k, v]) =>
      urlObject.searchParams.set(k, `${v}`),
    );

    logger[prefix].info(`${urlObject.toString()}`);

    return config;
  },
  onError: error => {
    logger[prefix].error(`Request error: ${JSON.stringify(error, null, 2)}`);
    recordError({
      name: 'NetworkError',
      message: 'API request interceptor error',
      params: {
        category: 'Network',
        action: 'request_interceptor_error',
        prefix,
      },
      errorCause: error,
    });
  },
});

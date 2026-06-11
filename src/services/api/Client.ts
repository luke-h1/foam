import { fetch } from 'expo/fetch';
import { logger, type AllowedPrefix } from '@app/utils/logger';
import {
  recordError,
  recordInfo,
  type MonitoringErrorName,
} from '@app/lib/sentry';
import { getApiMonitoringContext } from './monitoring';

const SERVICE_ERROR_MAP: Record<
  string,
  { exceptionName: string; errorName: MonitoringErrorName }
> = {
  twitch: { exceptionName: 'TwitchApiError', errorName: 'twitch_api_error' },
  bttv: { exceptionName: 'BTTVApiError', errorName: 'bttv_api_error' },
  stv: { exceptionName: 'SevenTVApiError', errorName: 'seven_tv_api_error' },
  ffz: { exceptionName: 'FFZApiError', errorName: 'ffz_api_error' },
};

function getServiceErrorInfo(logPrefix?: AllowedPrefix) {
  return (
    (logPrefix && SERVICE_ERROR_MAP[logPrefix]) ?? {
      exceptionName: 'ApiError',
      errorName: 'api_error' as MonitoringErrorName,
    }
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    exceptionName = 'ApiError',
  ) {
    super(message);
    this.name = exceptionName;
  }
}

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface ClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
  logPrefix?: AllowedPrefix;
}

export function createApiClient({
  baseURL,
  headers: defaultHeaders = {},
  logPrefix,
}: ClientOptions) {
  let authToken: string | undefined;
  const { exceptionName, errorName } = getServiceErrorInfo(logPrefix);
  const service = logPrefix ?? 'unknown';

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions & { data?: unknown } = {},
  ): Promise<T> {
    const { params, headers: extraHeaders = {}, data } = options;

    const url = new URL(`${baseURL}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v == null) continue;
        if (Array.isArray(v)) {
          url.searchParams.set(k, v.join(','));
        } else {
          url.searchParams.set(k, String(v));
        }
      }
    }

    if (logPrefix) {
      logger[logPrefix].info(url.toString());
    }

    // Merge case-insensitively: HTTP header names are case-insensitive, so a
    // per-request 'Client-Id' must replace a default 'Client-ID' rather than
    // coexist with it (fetch would combine them into "X, X" and Twitch
    // rejects the request).
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...defaultHeaders,
    };
    const headerKeyMap = new Map(
      Object.keys(headers).map(k => [k.toLowerCase(), k]),
    );
    for (const [name, value] of Object.entries(extraHeaders)) {
      const existing = headerKeyMap.get(name.toLowerCase());
      if (existing) {
        delete headers[existing];
      }
      headers[name] = value;
      headerKeyMap.set(name.toLowerCase(), name);
    }
    if (authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      recordError({
        name: 'network_error',
        exceptionName: `${exceptionName} (network)`,
        message: `${method} ${path} failed`,
        tags: { service, method },
        fingerprint: [service, 'network_failure', path],
        params: {
          action: 'http_request_failed',
          category: 'network',
          method,
          endpoint: path,
        },
        errorCause: error,
      });
      throw error;
    }

    const context = getApiMonitoringContext({
      baseURL,
      method,
      status: response.status,
      url: path,
    });

    if (response.status >= 400) {
      recordError({
        name: errorName,
        exceptionName,
        message: `${method} ${path} ${response.status}`,
        tags: {
          service,
          method,
          status: String(response.status),
          endpoint: String(context.endpoint ?? path),
        },
        // Group by service + method + path + status so each broken endpoint
        // creates exactly one Sentry issue regardless of query params.
        fingerprint: [service, method, path, String(response.status)],
        params: { action: 'response_error_status', ...context },
      });
    } else {
      recordInfo({
        name: 'api_info',
        message: `${method} ${context.endpoint ?? path} ${response.status}`,
        params: { action: 'response_ok', service, ...context },
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ApiError(
        body || `${method} ${path} ${response.status}`,
        response.status,
        exceptionName,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>('GET', path, options),
    post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>('POST', path, { ...options, data }),
    put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>('PUT', path, { ...options, data }),
    patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      request<T>('PATCH', path, { ...options, data }),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>('DELETE', path, options),
    setAuthToken: (token: string) => {
      authToken = token;
    },
    setDefaultHeader: (name: string, value: string) => {
      defaultHeaders[name] = value;
    },
    removeAuthToken: () => {
      authToken = undefined;
    },
    getAuthToken: () => authToken,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

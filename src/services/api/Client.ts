import { fetch } from 'expo/fetch';

import { parseJsonOnWorklet } from '@app/lib/offThreadJson';
import { type MonitoringErrorName, startSpanAsync } from '@app/lib/sentry';
import { type AllowedPrefix, logger } from '@app/utils/logger';

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
  /**
   * Per-request timeout in milliseconds. Foam depends on third-party emote and
   * cosmetic services (7TV, BTTV, FFZ, StreamElements) that can stall without
   * closing the connection; without a bound a hung request never rejects, so
   * react-query's `retry` never fires and the query stays pending forever.
   */
  timeout?: number;
  /**
   * When true, requests wait for the first auth token (bounded by
   * AUTH_READY_TIMEOUT_MS) instead of firing token-less on cold start.
   */
  requiresAuth?: boolean;
  /**
   * Called once with the error body when a request returns 401. Return true to
   * indicate the auth state was repaired (e.g. a stale header re-synced) so the
   * request is replayed once; false surfaces the original error.
   */
  onUnauthorized?: (body: string) => Promise<boolean>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const AUTH_READY_TIMEOUT_MS = 8_000;

export function createApiClient({
  baseURL,
  headers: defaultHeaders = {},
  logPrefix,
  timeout = DEFAULT_TIMEOUT_MS,
  requiresAuth = false,
  onUnauthorized,
}: ClientOptions) {
  let authToken: string | undefined;
  let resolveTokenReady: (() => void) | undefined;
  let tokenReady: Promise<void> | undefined = requiresAuth
    ? new Promise<void>(resolve => {
        resolveTokenReady = resolve;
      })
    : undefined;

  function settleTokenReady() {
    resolveTokenReady?.();
    resolveTokenReady = undefined;
    tokenReady = undefined;
  }

  async function waitForAuthToken(): Promise<void> {
    const pending = tokenReady;
    if (!pending) {
      return;
    }
    await new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        settleTokenReady();
        resolve();
      }, AUTH_READY_TIMEOUT_MS);
      void pending.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  const { exceptionName, errorName } = getServiceErrorInfo(logPrefix);
  const service = logPrefix ?? 'unknown';
  const log = logger[logPrefix ?? 'api'];

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions & { data?: unknown } = {},
    isRetry = false,
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

    const hasExplicitAuth = Object.keys(extraHeaders).some(
      key => key.toLowerCase() === 'authorization',
    );
    if (requiresAuth && !authToken && !hasExplicitAuth) {
      await waitForAuthToken();
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

    const requestContext = getApiMonitoringContext({
      baseURL,
      method,
      url: path,
    });

    const controller = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeout);

    let response: Response;
    try {
      response = await startSpanAsync(
        `${method} ${String(requestContext.provider ?? 'unknown')}`,
        'http.client',
        () =>
          fetch(url.toString(), {
            method,
            headers,
            body: data !== undefined ? JSON.stringify(data) : undefined,
            signal: controller.signal,
          }),
        {
          provider: String(requestContext.provider ?? 'unknown'),
          'server.address': String(requestContext.host ?? url.host),
          'http.request.method': method,
          'url.full': url.toString(),
        },
      );
    } catch (error) {
      if (didTimeout) {
        log.warn(`${method} ${path} timed out after ${timeout}ms`, {
          name: 'network_error',
          exceptionName: `${exceptionName} (timeout)`,
          error,
          tags: { service, method },
          fingerprint: [service, 'timeout', path],
          action: 'http_request_timeout',
          category: 'timeout',
          method,
          endpoint: path,
          timeoutMs: timeout,
        });
        // 408 Request Timeout gives downstream code (and react-query retries) a
        // meaningful status instead of an opaque AbortError.
        throw new ApiError(
          `${method} ${path} timed out after ${timeout}ms`,
          408,
          exceptionName,
        );
      }
      log.warn(`${method} ${path} failed`, {
        name: 'network_error',
        exceptionName: `${exceptionName} (network)`,
        error,
        tags: { service, method },
        fingerprint: [service, 'network_failure', path],
        action: 'http_request_failed',
        category: 'network',
        method,
        endpoint: path,
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const context = getApiMonitoringContext({
      baseURL,
      method,
      status: response.status,
      url: path,
    });

    if (response.status >= 400) {
      const body = await response.text().catch(() => '');

      if (response.status === 401 && onUnauthorized && !isRetry) {
        const recovered = await onUnauthorized(body);
        if (recovered) {
          return request<T>(method, path, options, true);
        }
      }

      // FFZ returns 404 "No such room" for channels that have never configured
      // FFZ; it's a benign empty result the caller handles, so don't log it (and
      // don't forward it to Sentry).
      const isExpectedFfzNoRoom =
        service === 'ffz' &&
        response.status === 404 &&
        body.includes('No such room');

      if (!isExpectedFfzNoRoom) {
        const logFailure = response.status >= 500 ? log.error : log.warn;
        logFailure(`${method} ${path} ${response.status}`, {
          name: errorName,
          exceptionName,
          tags: {
            service,
            method,
            status: String(response.status),
            endpoint: String(context.endpoint ?? path),
          },
          // Group by service + method + path + status so each broken endpoint
          // creates exactly one Sentry issue regardless of query params.
          fingerprint: [service, method, path, String(response.status)],
          action: 'response_error_status',
          ...context,
        });
      }

      throw new ApiError(
        body || `${method} ${path} ${response.status}`,
        response.status,
        exceptionName,
      );
    }

    log.info(`${method} ${context.endpoint ?? path} ${response.status}`, {
      name: 'api_info',
      action: 'response_ok',
      service,
      ...context,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    return parseJsonOnWorklet<T>(await response.text());
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
      settleTokenReady();
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

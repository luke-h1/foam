import { fetch } from 'expo/fetch';

import { PROVIDER_DESCRIPTORS } from '@app/constants/emote-providers';
import { deriveFromResponseOnWorklet } from '@app/lib/off-thread-json/deriveFromResponseOnWorklet';
import { parseJsonOnWorklet } from '@app/lib/off-thread-json/parseJsonOnWorklet';
import { startSpanAsync } from '@app/lib/sentry';
import type { ProviderId } from '@app/types/emote';
import { logger } from '@app/utils/logger';

import {
  type ApiMonitoringContext,
  getApiMonitoringContext,
} from './monitoring';

/**
 * Network failures the client already logged before it rethrew them as is.
 */
const loggedNetworkErrors = new WeakSet<Error>();

/**
 * True for an error the client already logged (or chose not to log as a
 * known empty result). A query error handler skips these, so each failure
 * is logged once.
 */
export function isApiClientError(error: unknown): boolean {
  return (
    error instanceof ApiError ||
    (error instanceof Error && loggedNetworkErrors.has(error))
  );
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number, exceptionName = 'ApiError') {
    super(message);
    this.name = exceptionName;
    this.status = status;
  }
}

type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

interface RequestOptions {
  params?: Record<string, QueryParamValue>;
  headers?: Record<string, string>;
  /**
   * Cancels the request. A cancelled request rejects without a log line.
   */
  signal?: AbortSignal;
}

interface ClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
  /**
   * Sets the log prefix, the error names and the monitoring provider tag.
   */
  provider?: ProviderId;
  /**
   * Returns true for a failed response that is a known empty result. The
   * client does not log it, but still throws it.
   */
  isExpectedFailure?: (status: number, body: string) => boolean;
  /**
   * Per-request timeout in ms. Without one, a hung request never rejects and
   * the query stays pending forever.
   */
  timeout?: number;
  /**
   * When true, requests wait for the first auth token (bounded by
   * AUTH_READY_TIMEOUT_MS) instead of firing token-less on cold start.
   */
  requiresAuth?: boolean;
  /**
   * Called once with the error body on a 401; return true if the auth state
   * was repaired so the request replays once.
   */
  onUnauthorized?: (body: string) => Promise<boolean>;
}

interface ResolveFailedResponseOptions {
  context: ApiMonitoringContext;
  isRetry: boolean;
  method: string;
  path: string;
  response: Response;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const AUTH_READY_TIMEOUT_MS = 8000;

export function createApiClient({
  baseURL,
  headers: defaultHeaders = {},
  provider,
  isExpectedFailure,
  timeout = DEFAULT_TIMEOUT_MS,
  requiresAuth = false,
  onUnauthorized,
}: ClientOptions) {
  let authToken: string | undefined;
  let resolveTokenReady: (() => void) | undefined;
  let tokenReadyTimer: ReturnType<typeof setTimeout> | undefined;

  function armTokenReady() {
    if (!requiresAuth) {
      return undefined;
    }

    return new Promise<void>(resolve => {
      resolveTokenReady = resolve;
    });
  }

  let tokenReady = armTokenReady();

  function settleTokenReady() {
    clearTimeout(tokenReadyTimer);
    tokenReadyTimer = undefined;
    resolveTokenReady?.();
    resolveTokenReady = undefined;
    tokenReady = undefined;
  }

  /**
   * Every waiting request shares one timer. It starts with the first wait,
   * not when the gate is armed, so a client that never sends a request keeps
   * no timer.
   */
  function waitForAuthToken(): Promise<void> {
    if (!tokenReady) {
      return Promise.resolve();
    }

    tokenReadyTimer ??= setTimeout(settleTokenReady, AUTH_READY_TIMEOUT_MS);

    return tokenReady;
  }

  const descriptor = provider ? PROVIDER_DESCRIPTORS[provider] : undefined;
  const exceptionName = descriptor?.exceptionName ?? 'ApiError';
  const errorName = descriptor?.errorName ?? 'api_error';
  const service = descriptor?.logPrefix ?? 'unknown';
  const monitoringProvider = descriptor?.monitoringName ?? 'unknown';
  const log = logger[descriptor?.logPrefix ?? 'api'];

  async function resolveFailedResponse({
    context,
    isRetry,
    method,
    path,
    response,
  }: ResolveFailedResponseOptions): Promise<
    { retry: true } | { retry: false; error: ApiError }
  > {
    const body = await response.text().catch(() => '');

    const recovered =
      response.status === 401 && onUnauthorized && !isRetry
        ? await onUnauthorized(body)
        : false;

    if (recovered) {
      return { retry: true };
    }

    const logFailure = response.status >= 500 ? log.error : log.warn;

    if (!isExpectedFailure?.(response.status, body)) {
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

    return {
      retry: false,
      error: new ApiError(
        body || `${method} ${path} ${response.status}`,
        response.status,
        exceptionName,
      ),
    };
  }

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions & {
      data?: unknown;
      derive?: (responseText: string) => T;
    } = {},
    isRetry = false,
  ): Promise<T> {
    const {
      params,
      headers: extraHeaders = {},
      data,
      derive,
      signal,
    } = options;

    const url = new URL(`${baseURL}${path}`);

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value == null) {
        continue;
      }

      url.searchParams.set(
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      );
    }

    if (descriptor) {
      log.info(url.toString());
    }

    const hasExplicitAuth = [
      ...Object.keys(defaultHeaders),
      ...Object.keys(extraHeaders),
    ].some(key => key.toLowerCase() === 'authorization');

    if (requiresAuth && !authToken && !hasExplicitAuth) {
      await waitForAuthToken();
    }

    // Merge case-insensitively: a per-request 'Client-Id' must replace a default 'Client-ID', or fetch combines them into "X, X" and Twitch rejects.
    const headers: Record<string, string> = {};

    headers['Accept'] = 'application/json';
    Object.assign(headers, defaultHeaders);

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

    if (authToken && !hasExplicitAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const requestContext = getApiMonitoringContext({
      baseURL,
      method,
      provider: monitoringProvider,
      url: path,
    });

    const controller = new AbortController();
    let didTimeout = false;

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeout);

    const abortFromCaller = () => controller.abort();
    signal?.addEventListener('abort', abortFromCaller);

    if (signal?.aborted) {
      controller.abort();
    }

    let response: Response;

    try {
      response = await startSpanAsync(
        `${method} ${monitoringProvider}`,
        'http.client',
        () =>
          fetch(url.toString(), {
            method,
            headers,
            body: data !== undefined ? JSON.stringify(data) : undefined,
            signal: controller.signal,
          }),
        {
          provider: monitoringProvider,
          'server.address': String(requestContext.host ?? url.host),
          'http.request.method': method,
          'url.full': url.toString(),
        },
      );
    } catch (error) {
      if (signal?.aborted && !didTimeout) {
        throw error;
      }

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

      if (error instanceof Error) {
        loggedNetworkErrors.add(error);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    }

    const context = getApiMonitoringContext({
      baseURL,
      method,
      provider: monitoringProvider,
      status: response.status,
      url: path,
    });

    const failure =
      response.status >= 400
        ? await resolveFailedResponse({
            context,
            isRetry,
            method,
            path,
            response,
          })
        : null;

    if (failure?.retry) {
      return request<T>(method, path, options, true);
    }

    if (failure) {
      throw failure.error;
    }

    log.info(`${method} ${context.endpoint ?? path} ${response.status}`, {
      name: 'api_info',
      action: 'response_ok',
      service,
      ...context,
    });

    if (response.status === 204) {
      // SAFETY: a 204 response has no body; callers hitting no-content endpoints type T accordingly
      return undefined as T;
    }

    const responseText = await response.text();

    return derive
      ? deriveFromResponseOnWorklet(responseText, derive)
      : parseJsonOnWorklet<T>(responseText);
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>('GET', path, options),
    post: <T, Body = unknown>(
      path: string,
      data?: Body,
      options?: RequestOptions,
    ) => request<T>('POST', path, { ...options, data }),
    /**
     * Like `post`, but `derive` turns the raw body into the result on the
     * background parse runtime. Only the derived result crosses back to the JS
     * thread, so return the smallest shape the caller needs. `derive` must be
     * a worklet.
     */
    postDerived: <TResult, Body = unknown>(
      path: string,
      data: Body,
      derive: (responseText: string) => TResult,
      options?: RequestOptions,
    ) => request<TResult>('POST', path, { ...options, data, derive }),
    put: <T, Body = unknown>(
      path: string,
      data?: Body,
      options?: RequestOptions,
    ) => request<T>('PUT', path, { ...options, data }),
    patch: <T, Body = unknown>(
      path: string,
      data?: Body,
      options?: RequestOptions,
    ) => request<T>('PATCH', path, { ...options, data }),
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
      tokenReady ??= armTokenReady();
    },
    getAuthToken: () => authToken,
  };
}

import type { FetchRequestInit } from 'expo/fetch';
import qs from 'qs';

import { platformFetch, type AppFetchFn } from './fetch';

type RequestMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
type ClientHeaderValue = boolean | null | number | string | undefined;

export type ClientHeaders =
  | Headers
  | [string, string][]
  | Record<string, ClientHeaderValue>;

export type ClientParams = Record<string, unknown>;
export type CustomParamsSerializer = (params: ClientParams) => string;

export type RequestConfig = Omit<
  FetchRequestInit,
  'body' | 'headers' | 'method'
> & {
  baseURL?: string;
  body?: BodyInit | null;
  cookie?: { name: string; value: string };
  data?: unknown;
  headers?: ClientHeaders;
  params?: ClientParams;
  paramsSerializer?: CustomParamsSerializer;
};

export interface InternalRequestConfig extends RequestConfig {
  baseURL: string;
  headers: Headers;
  method: RequestMethod;
  paramsSerializer: CustomParamsSerializer;
  url: string;
}

interface ClientRequestConfig extends RequestConfig {
  rawResponse?: false;
}

interface ClientRawResponseRequestConfig extends RequestConfig {
  rawResponse: true;
}

export type FetchClientResponse<TValue = unknown> = {
  data: TValue;
  headers: Headers;
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  config: InternalRequestConfig;
};

export type ClientResponse<TValue> = Omit<
  FetchClientResponse<TValue>,
  'config'
>;

class FetchHttpError<TValue = unknown> extends Error {
  public readonly config: InternalRequestConfig;
  public readonly response?: FetchClientResponse<TValue>;
  public readonly status?: number;

  public constructor({
    cause,
    config,
    message,
    response,
  }: {
    cause?: unknown;
    config: InternalRequestConfig;
    message: string;
    response?: FetchClientResponse<TValue>;
  }) {
    super(message, { cause });
    this.name = 'FetchHttpError';
    this.config = config;
    this.response = response;
    this.status = response?.status;
  }
}

export function isFetchHttpError(error: unknown): error is FetchHttpError {
  return error instanceof FetchHttpError;
}

export interface RequestInterceptor {
  onRequest: (
    config: InternalRequestConfig,
  ) => InternalRequestConfig | Promise<InternalRequestConfig>;
  onError?: (error: unknown) => unknown;
}

export interface ResponseInterceptor {
  onResponse: (
    response: FetchClientResponse<unknown>,
  ) => FetchClientResponse<unknown> | Promise<FetchClientResponse<unknown>>;
  onError?: (error: unknown) => unknown;
}

export type ResponseInterceptorFactory = (
  client: Client,
) => ResponseInterceptor;

const defaultParamsSerializer: CustomParamsSerializer = params =>
  qs.stringify(params, { arrayFormat: 'comma', skipNulls: true });

export interface ClientOptions {
  baseURL?: string;
  fetchFn?: AppFetchFn;
  headers?: ClientHeaders;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: (ResponseInterceptor | ResponseInterceptorFactory)[];
  paramsSerializer?: CustomParamsSerializer;
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function applyHeaders(target: Headers, source?: ClientHeaders): void {
  if (!source) {
    return;
  }

  if (source instanceof Headers) {
    source.forEach((value, key) => target.set(key, value));
    return;
  }

  if (Array.isArray(source)) {
    source.forEach(([key, value]) => target.set(key, value));
    return;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      target.set(key, `${value}`);
    }
  });
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    (typeof Blob !== 'undefined' && value instanceof Blob) ||
    (typeof FormData !== 'undefined' && value instanceof FormData) ||
    (typeof URLSearchParams !== 'undefined' &&
      value instanceof URLSearchParams) ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function createRequestBody(
  data: unknown,
  headers: Headers,
): BodyInit | null | undefined {
  if (data === undefined) {
    return undefined;
  }

  if (data === null) {
    return null;
  }

  if (isBodyInit(data)) {
    return data;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(data);
}

function createRequestUrl(config: InternalRequestConfig): string {
  const url = isAbsoluteUrl(config.url)
    ? new URL(config.url)
    : new URL(
        `${config.baseURL.replace(/\/+$/, '')}/${config.url.replace(/^\/+/, '')}`,
      );

  if (config.params) {
    const query = config.paramsSerializer(config.params);
    if (query) {
      url.search = url.search ? `${url.search.slice(1)}&${query}` : query;
    }
  }

  return url.toString();
}

async function parseResponseData(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('json') || contentType.includes('+json')) {
    return JSON.parse(text);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function withoutConfig<TValue>(
  response: FetchClientResponse<TValue>,
): ClientResponse<TValue> {
  const { config: _config, ...clientResponse } = response;
  return clientResponse;
}

export default class Client {
  private defaultBaseURL: string;

  private readonly defaultHeaders = new Headers();

  private readonly fetchFn: AppFetchFn;

  private readonly paramsSerializer: CustomParamsSerializer;

  private readonly requestInterceptors = new Set<RequestInterceptor>();

  private readonly responseInterceptors = new Set<ResponseInterceptor>();

  public constructor({
    baseURL = '',
    fetchFn = platformFetch,
    paramsSerializer = defaultParamsSerializer,
    requestInterceptors,
    responseInterceptors,
    headers,
  }: ClientOptions) {
    this.defaultBaseURL = baseURL;
    this.fetchFn = fetchFn;
    this.paramsSerializer = paramsSerializer;
    applyHeaders(this.defaultHeaders, headers);

    requestInterceptors?.forEach(interceptor => {
      this.addRequestInterceptor(interceptor);
    });
    responseInterceptors?.forEach(interceptor => {
      if (Client.isResponseInterceptorFactory(interceptor)) {
        this.addResponseInterceptor(interceptor(this));
      } else {
        this.addResponseInterceptor(interceptor);
      }
    });
  }

  public async request<TValue>(
    config: RequestConfig & {
      url: string;
      method: RequestMethod;
    },
  ): Promise<TValue> {
    const finalConfig = await this.applyRequestInterceptors(
      this.createInternalConfig(config),
    );
    const response = await this.performFetch<TValue>(finalConfig);

    if ('rawResponse' in config && config.rawResponse) {
      return withoutConfig(response) as TValue;
    }

    return response.data;
  }

  public get<TValue = unknown>(
    url: string,
    config?: ClientRequestConfig,
  ): Promise<TValue>;

  public get<TValue = unknown>(
    url: string,
    config: ClientRawResponseRequestConfig,
  ): Promise<ClientResponse<TValue>>;

  public get<TValue = unknown>(
    url: string,
    config: RequestConfig = {},
  ): Promise<TValue> {
    return this.request({
      ...config,
      url,
      method: 'GET',
    });
  }

  public post<TValue = unknown>(
    url: string,
    data?: unknown,
    config?: ClientRequestConfig,
  ): Promise<TValue>;

  public post<TValue = unknown>(
    url: string,
    data: unknown,
    config: ClientRawResponseRequestConfig,
  ): Promise<ClientResponse<TValue>>;

  public post<TValue = unknown>(
    url: string,
    data: unknown,
    config: RequestConfig = {},
  ): Promise<TValue> {
    return this.request({
      ...config,
      url,
      data,
      method: 'POST',
    });
  }

  public put<TValue = unknown>(
    url: string,
    data?: unknown,
    config?: ClientRequestConfig,
  ): Promise<TValue>;

  public put<TValue = unknown>(
    url: string,
    data: unknown,
    config: ClientRawResponseRequestConfig,
  ): Promise<ClientResponse<TValue>>;

  public put<TValue = unknown>(
    url: string,
    data: unknown,
    config: RequestConfig = {},
  ): Promise<TValue> {
    return this.request({ ...config, url, data, method: 'PUT' });
  }

  public patch<TValue = unknown>(
    url: string,
    data?: unknown,
    config?: ClientRequestConfig,
  ): Promise<TValue>;

  public patch<TValue = unknown>(
    url: string,
    data: unknown,
    config: ClientRawResponseRequestConfig,
  ): Promise<ClientResponse<TValue>>;

  public patch<TValue = unknown>(
    url: string,
    data: unknown,
    config: RequestConfig = {},
  ): Promise<TValue> {
    return this.request({
      ...config,
      url,
      data,
      method: 'PATCH',
    });
  }

  public delete<TValue = unknown>(
    url: string,
    config?: ClientRequestConfig,
  ): Promise<TValue>;

  public delete<TValue = unknown>(
    url: string,
    config: ClientRawResponseRequestConfig,
  ): Promise<ClientResponse<TValue>>;

  public delete<TValue = unknown>(
    url: string,
    config: RequestConfig = {},
  ): Promise<TValue> {
    return this.request({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  public set baseURL(url: string) {
    this.defaultBaseURL = url;
  }

  public get baseURL(): string {
    return this.defaultBaseURL;
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.add(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.add(interceptor);
  }

  public removeRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.delete(interceptor);
  }

  public removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.delete(interceptor);
  }

  public setAuthToken(token: string) {
    this.defaultHeaders.set('Authorization', `Bearer ${token}`);
  }

  public removeAuthToken() {
    this.defaultHeaders.delete('Authorization');
  }

  public getAuthToken() {
    return this.defaultHeaders.get('Authorization');
  }

  private createInternalConfig(
    config: RequestConfig & { method: RequestMethod; url: string },
  ): InternalRequestConfig {
    const headers = new Headers(this.defaultHeaders);
    applyHeaders(headers, config.headers);

    if (config.cookie) {
      headers.set('Cookie', `${config.cookie.name}=${config.cookie.value}`);
    }

    return {
      ...config,
      baseURL: config.baseURL ?? this.baseURL,
      headers,
      method: config.method,
      paramsSerializer: config.paramsSerializer ?? this.paramsSerializer,
    };
  }

  private async applyRequestInterceptors(
    config: InternalRequestConfig,
  ): Promise<InternalRequestConfig> {
    let currentConfig = config;

    for (const interceptor of this.requestInterceptors) {
      try {
        // eslint-disable-next-line no-await-in-loop
        currentConfig = await interceptor.onRequest(currentConfig);
      } catch (error) {
        if (interceptor.onError) {
          // eslint-disable-next-line no-await-in-loop
          await interceptor.onError(error);
        }
        throw error;
      }
    }

    return currentConfig;
  }

  private async applyResponseInterceptors<TValue>(
    response: FetchClientResponse<TValue>,
  ): Promise<FetchClientResponse<TValue>> {
    let currentResponse: FetchClientResponse<unknown> = response;

    for (const interceptor of this.responseInterceptors) {
      // eslint-disable-next-line no-await-in-loop
      currentResponse = await interceptor.onResponse(currentResponse);
    }

    return currentResponse as FetchClientResponse<TValue>;
  }

  private async applyResponseErrorInterceptors(error: unknown): Promise<never> {
    let currentError = error;

    for (const interceptor of this.responseInterceptors) {
      if (!interceptor.onError) {
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await interceptor.onError(currentError);
      } catch (nextError) {
        currentError = nextError;
      }
    }

    throw currentError;
  }

  private async performFetch<TValue>(
    config: InternalRequestConfig,
  ): Promise<FetchClientResponse<TValue>> {
    const requestUrl = createRequestUrl(config);
    const headers = new Headers(config.headers);
    const body =
      config.body === undefined
        ? createRequestBody(config.data, headers)
        : config.body;

    try {
      const response = await this.fetchFn(requestUrl, {
        body,
        credentials: config.credentials,
        headers,
        integrity: config.integrity,
        keepalive: config.keepalive,
        method: config.method,
        mode: config.mode,
        redirect: config.redirect,
        referrer: config.referrer,
        signal: config.signal,
        window: config.window,
      });
      const data = (await parseResponseData(response)) as TValue;
      const clientResponse: FetchClientResponse<TValue> = {
        config,
        data,
        headers: response.headers,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url || requestUrl,
      };

      if (!response.ok) {
        throw new FetchHttpError({
          config,
          message: `${config.url}_${config.method} request failed`,
          response: clientResponse,
        });
      }

      return this.applyResponseInterceptors(clientResponse);
    } catch (error) {
      if (isFetchHttpError(error)) {
        return this.applyResponseErrorInterceptors(error);
      }

      return this.applyResponseErrorInterceptors(
        new FetchHttpError({
          cause: error,
          config,
          message: `${config.url}_${config.method} request failed`,
        }),
      );
    }
  }

  private static isResponseInterceptorFactory(
    interceptor: ResponseInterceptor | ResponseInterceptorFactory,
  ): interceptor is ResponseInterceptorFactory {
    return (
      typeof interceptor === 'function' &&
      !('onResponse' in interceptor) &&
      !('onError' in interceptor)
    );
  }
}

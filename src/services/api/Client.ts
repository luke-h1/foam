import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CustomParamsSerializer,
  isAxiosError,
} from 'axios';
import omit from 'lodash/omit';
import qs from 'qs';

export type RequestConfig = Omit<AxiosRequestConfig, 'method' | 'url'> & {
  cookie?: { name: string; value: string };
};

interface ClientRequestConfig extends RequestConfig {
  rawResponse?: false;
}

interface ClientRawResponseRequestConfig extends RequestConfig {
  rawResponse: true;
}

export type ClientResponse<TValue> = Omit<
  AxiosResponse<TValue>,
  'config' | 'request'
>;

const defaultParamsSerializer: CustomParamsSerializer = params =>
  qs.stringify(params, { arrayFormat: 'comma' });

export interface ClientOptions {
  baseURL?: string;
  headers?: AxiosRequestConfig['headers'];
  paramsSerializer?: CustomParamsSerializer;
}

export default class Client {
  private readonly axios: AxiosInstance;

  public constructor({
    baseURL,
    paramsSerializer = defaultParamsSerializer,
    headers,
  }: ClientOptions) {
    this.axios = Axios.create({
      baseURL,
      paramsSerializer,
      headers,
    });
  }

  public async request<TValue>(
    config: RequestConfig & {
      url: string;
      method: AxiosRequestConfig['method'];
    },
  ): Promise<TValue> {
    try {
      // Check for cookie in config and set it
      const response = await this.axios(config);

      if ('rawResponse' in config && config.rawResponse) {
        return omit(response, ['config', 'request']) as TValue;
      }

      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        // TODO: send error to new-relic/sentry
        return error.response?.data;
      }
      throw error;
    }
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
    config: RequestConfig = {
      withCredentials: true,
    },
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
    config: RequestConfig = {
      withCredentials: true,
    },
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
    config: RequestConfig = {
      withCredentials: true,
    },
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
    config: RequestConfig = {
      withCredentials: true,
    },
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
    config: RequestConfig = {
      withCredentials: true,
    },
  ): Promise<TValue> {
    return this.request({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  public set baseURL(url: string) {
    this.axios.defaults.baseURL = url;
  }

  public get baseURL(): string {
    return this.axios.defaults.baseURL ?? '';
  }

  public setToken(value: string): void {
    this.axios.defaults.headers.common.Authorization = `Bearer ${value}`;
  }

  public removeToken(): void {
    this.axios.defaults.headers.common.Authorization = undefined;
  }
}

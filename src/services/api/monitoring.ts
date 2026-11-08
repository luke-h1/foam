import type { ProviderMonitoringName } from '@app/constants/emote-providers';

type ApiMonitoringProvider = ProviderMonitoringName | 'unknown';

export interface ApiMonitoringContext {
  endpoint: string;
  host?: string;
  method?: string;
  provider: ApiMonitoringProvider;
  status?: number;
  url: string;
}

interface ApiMonitoringInput {
  baseURL?: string;
  method?: string;
  provider: ApiMonitoringProvider;
  status?: number;
  url?: string;
}

function trimUrlParts(baseURL: string, url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const trimmedBase = baseURL.replace(/\/+$/, '');
  const trimmedUrl = url.replace(/^\/+/, '');

  if (!trimmedBase) {
    return trimmedUrl;
  }

  return `${trimmedBase}/${trimmedUrl}`;
}

export function getApiMonitoringContext({
  baseURL = '',
  method,
  provider,
  status,
  url = '',
}: ApiMonitoringInput): ApiMonitoringContext {
  const raw_url = trimUrlParts(baseURL, url);

  try {
    const parsedUrl = new URL(raw_url);

    return {
      endpoint: parsedUrl.pathname,
      host: parsedUrl.host,
      method: method?.toUpperCase(),
      provider,
      status,
      url: parsedUrl.toString(),
    };
  } catch {
    return {
      endpoint: url,
      method: method?.toUpperCase(),
      provider,
      status,
      url: raw_url,
    };
  }
}

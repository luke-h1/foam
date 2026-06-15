export type ApiProvider =
  | 'app'
  | 'auth_proxy'
  | 'bttv'
  | 'ffz'
  | 'seven_tv'
  | 'stream_elements'
  | 'twitch'
  | 'unknown';

interface ApiMonitoringInput {
  baseURL?: string;
  method?: string;
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

function getProvider(rawUrl: string, host: string): ApiProvider {
  const target = `${host} ${rawUrl}`.toLowerCase();
  const authProxyBaseUrl = process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL;

  if (authProxyBaseUrl && target.includes(authProxyBaseUrl)) {
    return 'auth_proxy';
  }

  if (target.includes('twitch.tv')) {
    return 'twitch';
  }

  if (target.includes('frankerfacez')) {
    return 'ffz';
  }

  if (target.includes('betterttv')) {
    return 'bttv';
  }

  if (target.includes('7tv')) {
    return 'seven_tv';
  }

  if (target.includes('streamelements')) {
    return 'stream_elements';
  }

  if (target.includes('/api/')) {
    return 'app';
  }

  return 'unknown';
}

export function getApiMonitoringContext({
  baseURL = '',
  method,
  status,
  url = '',
}: ApiMonitoringInput): Record<string, string | number | undefined> {
  const raw_url = trimUrlParts(baseURL, url);

  try {
    const parsedUrl = new URL(raw_url);
    return {
      endpoint: parsedUrl.pathname,
      host: parsedUrl.host,
      method: method?.toUpperCase(),
      provider: getProvider(raw_url, parsedUrl.host),
      status,
      url: parsedUrl.toString(),
    };
  } catch {
    return {
      endpoint: url,
      method: method?.toUpperCase(),
      provider: getProvider(raw_url, ''),
      status,
      url: raw_url,
    };
  }
}

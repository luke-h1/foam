import { fetch } from 'expo/fetch';

import { parseJsonOnWorklet } from '@app/lib/off-thread-json/parseJsonOnWorklet';

import { isE2EMode } from './env';

export interface TwitchTokenValidation {
  clientId?: string;
  expiresInSeconds?: unknown;
}

export async function validateTwitchToken(
  token: string,
): Promise<TwitchTokenValidation | null> {
  if (isE2EMode) {
    return {};
  }

  const res = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) {
    return null;
  }

  const body = await parseJsonOnWorklet<{
    client_id?: string;
    expires_in?: unknown;
  } | null>(await res.text()).catch(() => null);

  return { clientId: body?.client_id, expiresInSeconds: body?.expires_in };
}

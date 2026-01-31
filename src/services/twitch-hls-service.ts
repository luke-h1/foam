/**
 * Service for fetching Twitch HLS stream URLs
 *
 * ⚠️ NOT FOR PRODUCTION USE ⚠️
 *
 * This service uses Twitch's unofficial GQL API (gql.twitch.tv) to obtain
 * stream playback access tokens. This approach:
 * - Uses undocumented/unofficial Twitch APIs that could break at any time
 * - Uses Twitch's internal client ID (same as their web player)
 * - May violate Twitch's Terms of Service
 * - Is intended for development/debugging/experimentation only
 * - Should never be used in production builds
 *
 * Flow:
 * 1. Get access token via Twitch GQL API (unofficial)
 * 2. Use token + signature to construct HLS m3u8 URL
 */

import axios from 'axios';

export interface TwitchAccessToken {
  token: string;
  sig: string;
}

interface GqlPlaybackAccessTokenResponse {
  data: {
    streamPlaybackAccessToken: {
      signature: string;
      value: string;
    } | null;
  };
}

export interface HlsStreamOptions {
  allowSource?: boolean;
  playerBackend?: 'mediaplayer' | 'html5';
}

const DEFAULT_OPTIONS: HlsStreamOptions = {
  allowSource: true,
  playerBackend: 'html5',
};

// Twitch's public client ID used by their web player
const TWITCH_GQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

/**
 * Fetches the access token and signature required for HLS streaming
 * Uses Twitch's GQL API (same as their web player)
 *
 * @param channelName - The Twitch channel name (login)
 * @returns Promise with token and signature
 */
export async function getChannelAccessToken(
  channelName: string,
): Promise<TwitchAccessToken> {
  const query = {
    operationName: 'PlaybackAccessToken',
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712',
      },
    },
    variables: {
      isLive: true,
      login: channelName.toLowerCase(),
      isVod: false,
      vodID: '',
      playerType: 'embed',
    },
  };

  const response = await axios.post<GqlPlaybackAccessTokenResponse>(
    'https://gql.twitch.tv/gql',
    query,
    {
      headers: {
        'Client-ID': TWITCH_GQL_CLIENT_ID,
        'Content-Type': 'application/json',
      },
    },
  );

  const tokenData = response.data.data.streamPlaybackAccessToken;

  if (!tokenData) {
    throw new Error('Stream is offline or unavailable');
  }

  return {
    token: tokenData.value,
    sig: tokenData.signature,
  };
}

/**
 * Builds the HLS stream URL for a given channel
 *
 * @param channelName - The Twitch channel name
 * @param accessToken - The access token object with token and signature
 * @param options - Optional streaming options
 * @returns The complete HLS m3u8 URL
 */
export function buildHlsStreamUrl(
  channelName: string,
  accessToken: TwitchAccessToken,
  options: HlsStreamOptions = DEFAULT_OPTIONS,
): string {
  const params = new URLSearchParams({
    token: accessToken.token,
    sig: accessToken.sig,
    allow_source: String(options.allowSource ?? true),
    player_backend: options.playerBackend ?? 'html5',
    allow_audio_only: 'true',
    fast_bread: 'true',
    p: String(Math.floor(Math.random() * 1000000)),
  });

  return `https://usher.ttvnw.net/api/channel/hls/${channelName.toLowerCase()}.m3u8?${params.toString()}`;
}

/**
 * Gets the complete HLS stream URL for a channel
 * Combines access token fetch and URL building
 *
 * @param channelName - The Twitch channel name
 * @param options - Optional streaming options
 * @returns Promise with the HLS m3u8 URL
 */
export async function getHlsStreamUrl(
  channelName: string,
  options?: HlsStreamOptions,
): Promise<string> {
  const accessToken = await getChannelAccessToken(channelName);
  return buildHlsStreamUrl(channelName, accessToken, options);
}

export const twitchHlsService = {
  getChannelAccessToken,
  buildHlsStreamUrl,
  getHlsStreamUrl,
};

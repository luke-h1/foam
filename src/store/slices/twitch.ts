import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { parseTwitchClip, parseTwitchVideo } from '../parsers/twitchParsers';
import { MessageCardDetails } from '../services/types/messages';

export const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';

export const twitchApi = createApi({
  reducerPath: 'twitchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TWITCH_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const { accessToken } = state.chat.me;
      headers.set(
        'Client-ID',
        process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID as string,
      );
      headers.set('Authorization', `Bearer ${accessToken}`);
      return headers;
    },
  }),
  endpoints: builder => ({
    twitchClip: builder.query<MessageCardDetails | null, string>({
      query: clipId => `/clips?id=${clipId}`,
      transformResponse: parseTwitchClip,
    }),
    twitchVideo: builder.query<MessageCardDetails | null, string>({
      query: videoId => `/videos?id=${videoId}`,
      transformResponse: parseTwitchVideo,
    }),
  }),
});
export const { useTwitchClipQuery, useTwitchVideoQuery } = twitchApi;

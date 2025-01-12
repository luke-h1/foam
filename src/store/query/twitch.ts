import { twitchApi as _twitchApi } from '@app/services/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  parseTwitchClip,
  parseTwitchVideo,
} from '../reducers/chat/parsers/twitchParser';
import { MessageCardDetails } from '../reducers/chat/util/messages/types/messages';

export const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';

export const twitchApi = createApi({
  reducerPath: 'twitchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TWITCH_API_BASE_URL,
    prepareHeaders: headers => {
      const token = _twitchApi.getAuthToken();
      headers.set(
        'Client-ID',
        process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID as string,
      );
      headers.set('Authorization', `Bearer ${token}`);
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

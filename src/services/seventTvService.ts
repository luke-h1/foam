import {
  EmotesList,
  StvChannelEmotesResponse,
  StvGlobalEmotesResponse,
} from '../utils/third-party/types';
import { sevenTvApi } from './api';

interface SevenTvFile {
  name: string;
  static_name: string;
  width: number;
  height: number;
  frame_count: number;
  size: number;
  format: string;
}

interface SevenTvHost {
  url: string;
  files: SevenTvFile[];
}

interface SevenTvVersion {
  id: string;
  name: string;
  description?: string;
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
}

export interface GetEmoteResponse {
  id: string;
  name: string;
  flags: number;
  tags: string[];
  lifecycle: number;
  state: string[];
  listed: boolean;
  animated: boolean;
  host: SevenTvHost;
  versions: SevenTvVersion[];
  createdAt: number;
}

export const sevenTvService = {
  getChannelEmotes: async (channelId: string | null): Promise<EmotesList> => {
    if (!channelId) {
      return [];
    }

    try {
      const { data } = await sevenTvApi.get<StvChannelEmotesResponse>(
        `/users/twitch/${channelId}`,
      );

      return data.emote_set.emotes.map(emote => ({
        id: emote.id,
        code: emote.name,
        // eslint-disable-next-line no-bitwise
        isZeroWidth: (emote.flags || 0 & 256) !== 0,
        channelId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const { data } =
        await sevenTvApi.get<StvGlobalEmotesResponse>('/emote-sets/global');

      return data.emotes.map(c => ({
        id: c.id,
        code: c.name,
        // eslint-disable-next-line no-bitwise
        isZeroWidth: (c.flags || 0 & 256) !== 0,
        channelId: null,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
  getEmote: async (emoteId: string) => {
    const { data } = await sevenTvApi.get<GetEmoteResponse>(
      `/emotes/${emoteId}`,
    );
    return data;
  },
} as const;

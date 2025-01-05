import { OmitStrict, DeepRequired } from '@app/types/util';
import { sevenTvApi } from './api';
import { definitions } from './types/generated/stv.generated';
import { Badge } from './types/util';

export type StvBadge = OmitStrict<StvRawBadge, 'users'>;
export interface StvCosmeticsResponse {
  badges: StvRawBadge[];
  paints: StvPaint[];
}

export interface StvCosmetics {
  badges: Badge<StvBadge>;
}
export type StvGlobalEmotesResponse = DeepRequired<
  definitions['model.EmoteSetModel']
>;

export type StvChannelEmotesResponse = DeepRequired<
  definitions['model.UserConnectionModel']
>;

export type StvEmoteSet = DeepRequired<definitions['model.EmoteSetModel']>;
export type StvEmote = DeepRequired<definitions['model.ActiveEmoteModel']>;

export interface StvRawBadge {
  id: string;
  name: string;
  tooltip: string;
  urls: ['1' | '2' | '3', string][];
  users: string[];
  misc?: boolean;
}
export interface StvPaintShadow {
  x_offset: number;
  y_offset: number;
  radius: number;
  color: number;
}

export interface StvPaint {
  id: string;
  name: string;
  users: string[];
  function: string;
  color: number | null;
  stops: { at: number; color: number }[];
  repeat: boolean;
  angle: number;
  image_url?: string;
  shape?: string;
  drop_shadow: StvPaintShadow;
  drop_shadows?: StvPaintShadow[];
  animation: {
    speed: 0;
    keyframes: null;
  };
}

const stvService = {
  listGlobalEmotes: async (): Promise<StvGlobalEmotesResponse> => {
    const { data } =
      await sevenTvApi.get<StvGlobalEmotesResponse>('/emote-sets/global');

    return data;
  },
  listChannelEmotes: async (
    channelId: string,
  ): Promise<StvChannelEmotesResponse> => {
    const { data } = await sevenTvApi.get<StvChannelEmotesResponse>(
      `/users/twitch/${channelId}`,
    );
    return data;
  },
} as const;

export default stvService;

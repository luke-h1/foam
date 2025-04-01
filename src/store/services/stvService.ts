import { sevenTvApi } from './api';
import { StvChannelEmotesResponse, StvGlobalEmotesResponse } from './types/stv';

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
  // listCosmetics: async (): Promise<StvCosmeticsResponse> => {
  //   const { data } = await axios.get(
  //     `${V2_API_BASE_URL}/cosmetics?user_identifier=twitch_id`
  //   );
  //   return data;
  // },
} as const;

export default stvService;

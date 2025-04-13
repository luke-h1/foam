import {
  ffzService,
  SanitisiedEmoteSet,
  sevenTvService,
  twitchEmoteService,
} from '@app/services';
import { create, StateCreator } from 'zustand';

interface ChatState {
  // Twitch.tv emotes
  twitchChannelEmotes: SanitisiedEmoteSet[];
  setTwitchChannelEmotes: (sanitisedEmoteSet: SanitisiedEmoteSet[]) => void;

  twitchGlobalEmotes: SanitisiedEmoteSet[];
  setTwitchGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  // 7TV emotes
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  setSevenTvChannelEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  setSevenTvGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  // FFZ emotes
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
}

const chatStoreCreator: StateCreator<ChatState> = (set, get) => ({
  /**
   * Twitch
   */
  twitchChannelEmotes: [],
  twitchGlobalEmotes: [],
  setTwitchChannelEmotes: emoteSet => {
    return set(state => ({
      ...state,
      twitchChannelEmotes: emoteSet,
    }));
  },
  setTwitchGlobalEmotes: emoteSet => {
    return set(state => ({
      ...state,
      twitchGlobalEmotes: emoteSet,
    }));
  },
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  /**
   * Seven TV
   */
  sevenTvChannelEmotes: [],
  sevenTvGlobalEmotes: [],
  setSevenTvChannelEmotes: emoteSet => {
    return set(state => ({
      ...state,
      sevenTvChannelEmotes: emoteSet,
    }));
  },
  setSevenTvGlobalEmotes: emoteSet => {
    return set(state => ({
      ...state,
      sevenTvGlobalEmotes: emoteSet,
    }));
  },
  loadChannelResources: async (channelId: string) => {
    const sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
    const [
      twitchChannelEmotes,
      twitchGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
    ] = await Promise.all([
      twitchEmoteService.getIvrChannelEmotes(channelId),
      twitchEmoteService.getGlobalEmotes(),
      ffzService.getSanitisedChannelEmotes(channelId),
      ffzService.getSanitisedGlobalEmotes(),
      sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
      sevenTvService.getSanitisedEmoteSet('global'),
    ]);
    set(state => ({
      ...state,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
    }));
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);

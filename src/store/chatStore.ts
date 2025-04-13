import {
  ffzService,
  SanitisiedEmoteSet,
  sevenTvService,
  twitchEmoteService,
} from '@app/services';
import { create, StateCreator } from 'zustand';

interface ChatState {
  // Emojis
  emojis: SanitisiedEmoteSet[];
  setEmojis: (sanitisedEmoteSet: SanitisiedEmoteSet[]) => void;

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

  loadChannelResources: (channelId: string) => Promise<void>;
}

const chatStoreCreator: StateCreator<ChatState> = (set, get) => ({
  emojis: [],
  setEmojis: emoteSet => {
    return set(state => ({
      ...state,
      emojis: emoteSet,
    }));
  },

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
      // twitchChannelEmotes,
      // twitchGlobalEmotes,
      // ffzChannelEmotes,
      // ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
    ] = await Promise.all([
      // twitchEmoteService.getIvrChannelEmotes(channelId),
      // twitchEmoteService.getGlobalEmotes(),
      // ffzService.getSanitisedChannelEmotes(channelId),
      // ffzService.getSanitisedGlobalEmotes(),
      sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
      sevenTvService.getSanitisedEmoteSet('global'),
    ]);
    console.info('loaded stv emotes 🚀');
    set(state => ({
      ...state,
      twitchChannelEmotes: [],
      twitchGlobalEmotes: [],
      ffzChannelEmotes: [],
      ffzGlobalEmotes: [],
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
    }));
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);

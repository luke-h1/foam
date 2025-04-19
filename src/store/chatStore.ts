import { SanitisiedEmoteSet, sevenTvService } from '@app/services';
import { create, StateCreator } from 'zustand';

interface ChatUser {
  name: string;
  color: string;
  // 7tv paints
  cosmetics: unknown[];
  avatar: string | null;
  userId: string;
}

export interface Bit {
  name: string;
  tiers: {
    min_bits: string;
  }[];
}
interface ChatState {
  // Loading state
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Emojis
  emojis: SanitisiedEmoteSet[];
  setEmojis: (sanitisedEmoteSet: SanitisiedEmoteSet[]) => void;

  // bits
  bits: Bit[];
  setBits: (bits: Bit[]) => void;

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

  // chat users
  ttvUsers: ChatUser[];
  setTTvUsers: (users: ChatUser[]) => void;

  loadChannelResources: (channelId: string) => Promise<boolean>;
}

const chatStoreCreator: StateCreator<ChatState> = (set, get) => ({
  loading: false,
  setLoading: loading => {
    set(state => ({
      ...state,
      loading,
    }));
  },
  bits: [],
  setBits: bits => {
    return set(state => ({
      ...state,
      bits,
    }));
  },
  ttvUsers: [],
  setTTvUsers: users => {
    return set(state => ({
      ...state,
      ttvUsers: users,
    }));
  },
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
    set(state => ({ ...state, loading: true })); // Set loading to true
    try {
      const sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
      const [sevenTvChannelEmotes, sevenTvGlobalEmotes] = await Promise.all([
        sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
        sevenTvService.getSanitisedEmoteSet('global'),
      ]);
      // eslint-disable-next-line no-console
      console.info('loaded stv emotes 🚀');
      set(state => ({
        ...state,
        twitchChannelEmotes: [],
        twitchGlobalEmotes: [],
        ffzChannelEmotes: [],
        ffzGlobalEmotes: [],
        sevenTvChannelEmotes,
        sevenTvGlobalEmotes,
        loading: false, // Set loading to false after success
      }));
      return true; // Indicate success
    } catch (error) {
      console.error('Error loading channel resources:', error);
      set(state => ({ ...state, loading: false })); // Set loading to false on error
      return false; // Indicate failure
    }
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);

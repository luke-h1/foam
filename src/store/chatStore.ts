import { SanitisiedEmoteSet, twitchEmoteService } from '@app/services';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './persist';

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

export const useChatStore = create(
  persist<ChatState>(
    (set, get) => ({
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
        const [
          twitchChannelEmotes,
          twitchGlobalEmotes,
          ffzChannelEmotes,
          ffzGlobalEmotes,
          seventTvChannelEmotes,
          sevenTvGlobalEmotes,
        ] = await Promise.all([
          twitchEmoteService.
        ]);
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

import { SanitisiedEmoteSet } from '@app/services';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './persist';

interface ChatState {
  // Twitch.tv emotes
  twitchChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];

  // 7TV emotes
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];

  // FFZ emotes
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
}

export const useChatStore = create(
  persist<ChatState>((set, get) => ({}), {
    name: 'chat-store',
    storage: createJSONStorage(() => zustandStorage),
  }),
);

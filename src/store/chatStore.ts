import {
  bttvEmoteService,
  ffzService,
  SanitisedBadgeSet,
  SanitisiedEmoteSet,
  sevenTvService,
  twitchBadgeService,
  twitchEmoteService,
} from '@app/services';
import { chatterinoService } from '@app/services/chatterinoService';
import { ParsedPart } from '@app/utils';
import { logger } from '@app/utils/logger';
import newRelic from 'newrelic-react-native-agent';
import { ViewStyle } from 'react-native';
import { ChatUserstate } from 'tmi.js';
import { create, StateCreator } from 'zustand';

interface CosmeticPaint {
  id: string;
  name: string;
  style: string;
  shape: string;
  backgroundImage: string;
  shadows: string | null;
  KIND: 'animated' | 'non-animated';
  url: string;
}

export interface ChatUser {
  name: string;
  color: string;
  // 7tv paints
  cosmetics?: {
    [key: string]: unknown;
    personal_emotes?: SanitisedBadgeSet;
    paints: CosmeticPaint[];
    badges: SanitisedBadgeSet[];
    user_info: {
      lastUpdate: number;
      user_id: string;
      ttv_user_id: string | null;
      paint_id: string | null;
      badge_id: string | null;
      avatar_url: string | null;
      personal_emotes: SanitisedBadgeSet[];
      personal_set_id: string[];
      color?: string;
    };
  };
  avatar: string | null;
  userId: string;
}

export interface Bit {
  name: string;
  tiers: {
    min_bits: string;
  }[];
}

export interface ChatMessageType {
  userstate: ChatUserstate;
  message: ParsedPart[];
  badges: SanitisedBadgeSet[];
  channel: string;
  message_id: string;
  message_nonce: string;
  sender: string;
  style?: ViewStyle;
  parentDisplayName: string;
  replyDisplayName: string;
  replyBody: string;
}

export interface ChatState {
  status: 'idle' | 'loading' | 'fulfilled' | 'error';

  /**
   * Emojis
   */
  emojis: SanitisiedEmoteSet[];
  setEmojis: (sanitisedEmoteSet: SanitisiedEmoteSet[]) => void;

  /**
   * Bits
   */
  bits: Bit[];
  setBits: (bits: Bit[]) => void;

  /**
   * Twitch emotes
   */
  twitchChannelEmotes: SanitisiedEmoteSet[];
  setTwitchChannelEmotes: (sanitisedEmoteSet: SanitisiedEmoteSet[]) => void;

  twitchGlobalEmotes: SanitisiedEmoteSet[];
  setTwitchGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  /**
   * 7TV emotes
   */
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  setSevenTvChannelEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  setSevenTvGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  /**
   * FFZ emomtes
   */
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * BTTV emotes
   */
  bttvGlobalEmotes: SanitisiedEmoteSet[];
  setBttvGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  bttvChannelEmotes: SanitisiedEmoteSet[];
  setBttvChannelEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  /**
   * Chat users
   */
  ttvUsers: ChatUser[];
  setTTvUsers: (users: ChatUser[]) => void;

  /**
   * Twitch badges
   */
  twitchGlobalBadges: SanitisedBadgeSet[];
  setTwitchGlobalBadges: (badges: SanitisedBadgeSet[]) => void;

  twitchChannelBadges: SanitisedBadgeSet[];
  setTwitchChannelBadges: (badges: SanitisedBadgeSet[]) => void;

  /**
   * FFZ badges
   */
  ffzGlobalBadges: SanitisedBadgeSet[];
  setFfzGlobalBadges: (badges: SanitisedBadgeSet[]) => void;

  ffzChannelBadges: SanitisedBadgeSet[];
  setFfzChannelBadges: (badges: SanitisedBadgeSet[]) => void;

  /**
   * Chatterino badges
   */
  chatterinoBadges: SanitisedBadgeSet[];
  setChatterinoBadges: (badges: SanitisedBadgeSet[]) => void;

  loadChannelResources: (channelId: string) => Promise<boolean>;
  clearChannelResources: () => void;

  /**
   * Messages for replies
   * Stored in state so we can keep a buffer of messages (max 150) & know certain tmi
   * details
   */
  messages: ChatMessageType[];
  addMessage: (message: ChatMessageType) => void;
  clearMessages: () => void;
}

const chatStoreCreator: StateCreator<ChatState> = set => ({
  status: 'idle',
  bits: [],
  setBits: bits => {
    return set(state => ({
      ...state,
      bits,
    }));
  },

  /**
   * Chat users
   */
  ttvUsers: [],
  setTTvUsers: users => {
    return set(state => ({
      ...state,
      ttvUsers: users,
    }));
  },

  /**
   * Placeholder for chatterino emotes
   */
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

  /**
   * FFZ
   */
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

  /**
   * BTTV
   */
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],
  setBttvChannelEmotes: emoteSet => {
    return set(state => ({
      ...state,
      bttvChannelEmotes: emoteSet,
    }));
  },

  setBttvGlobalEmotes: emoteSet => {
    return set(state => ({
      ...state,
      bttvGlobalEmotes: emoteSet,
    }));
  },

  /**
   * Twitch Badges
   */
  twitchGlobalBadges: [],
  setTwitchGlobalBadges: badgeSet => {
    return set(state => ({
      ...state,
      twitchBadges: badgeSet,
    }));
  },

  twitchChannelBadges: [],
  setTwitchChannelBadges: badgeSet => {
    return set(state => ({
      ...state,
      twitchBadges: badgeSet,
    }));
  },

  /**
   * FFZ badges
   */
  ffzGlobalBadges: [],
  setFfzGlobalBadges: badgeSet => {
    return set(state => ({
      ...state,
      ffzGlobalBadges: badgeSet,
    }));
  },
  ffzChannelBadges: [],
  setFfzChannelBadges: badgeSet => {
    return set(state => ({
      ...state,
      ffzGlobalBadges: badgeSet,
    }));
  },

  chatterinoBadges: [],
  setChatterinoBadges: badgeSet => {
    return set(state => ({
      ...state,
      chatterinoBadges: badgeSet,
    }));
  },

  clearChannelResources: () => {
    set(() => ({
      status: 'idle',
      twitchChannelEmotes: [],
      twitchGlobalEmotes: [],
      ffzChannelEmotes: [],
      ffzGlobalEmotes: [],
      sevenTvChannelEmotes: [],
      sevenTvGlobalEmotes: [],
      emojis: [],
      ttvUsers: [],
      bits: [],
      twitchChannelBadges: [],
      twitchGlobalBadges: [],
      ffzGlobalBadges: [],
      ffzChannelBadges: [],
      chatterinoBadges: [],
    }));
  },
  loadChannelResources: async (channelId: string) => {
    set(state => ({ ...state, status: 'loading' }));
    try {
      let sevenTvSetId = 'global';
      try {
        sevenTvSetId = await sevenTvService.getEmoteSetId(channelId);
      } catch (error) {
        logger.chat.warn('Failed to get 7TV emote set ID:', error);
      }

      const [
        /**
         * Emotes
         */
        sevenTvChannelEmotes,
        sevenTvGlobalEmotes,
        twitchChannelEmotes,
        twitchGlobalEmotes,
        bttvGlobalEmotes,
        bttvChannelEmotes,
        ffzChannelEmotes,
        ffzGlobalEmotes,

        /**
         * Twitch Badges
         */
        twitchChannelBadges,
        twitchGlobalBadges,

        /**
         * FFZ badges
         */
        ffzGlobalBadges,
        ffzChannelBadges,

        /**
         * Chatterino badges
         */
        chatterinoBadges,
      ] = await Promise.allSettled([
        sevenTvService.getSanitisedEmoteSet(sevenTvSetId),
        sevenTvService.getSanitisedEmoteSet('global'),
        twitchEmoteService.getChannelEmotes(channelId),
        twitchEmoteService.getGlobalEmotes(),
        bttvEmoteService.getSanitisedGlobalEmotes(),
        bttvEmoteService.getSanitisedChannelEmotes(channelId),
        ffzService.getSanitisedChannelEmotes(channelId),
        ffzService.getSanitisedGlobalEmotes(),
        twitchBadgeService.listSanitisedChannelBadges(channelId),
        twitchBadgeService.listSanitisedGlobalBadges(),
        ffzService.getSanitisedGlobalBadges(),
        ffzService.getSanitisedChannelBadges(channelId),
        chatterinoService.listSanitisedBadges(),
      ]);

      logger.chat.info('fetched emotes 🚀');

      const getValue = <T>(result: PromiseSettledResult<T[]>): T[] =>
        result.status === 'fulfilled' ? result.value : [];

      // Log empty responses from emote providers
      const logEmptyEmoteResponse = (
        provider: string,
        type: string,
        emotes: PromiseSettledResult<SanitisiedEmoteSet[]>,
      ) => {
        if (getValue(emotes).length === 0) {
          const message = `Empty response from ${provider} ${type}`;
          newRelic.logWarn(message);
        }
      };

      // Log empty responses from badge providers
      const logEmptyBadgeResponse = (
        provider: string,
        type: string,
        badges: PromiseSettledResult<SanitisedBadgeSet[]>,
      ) => {
        if (getValue(badges).length === 0) {
          const message = `Empty response from ${provider} ${type} badges`;
          newRelic.logWarn(message);
        }
      };

      logEmptyEmoteResponse('7TV emotes', 'channel', sevenTvChannelEmotes);
      logEmptyEmoteResponse('7TV emotes', 'global', sevenTvGlobalEmotes);
      logEmptyEmoteResponse('Twitch emotes', 'channel', twitchChannelEmotes);
      logEmptyEmoteResponse('Twitch', 'global', twitchGlobalEmotes);
      logEmptyEmoteResponse('BTTV', 'global', bttvGlobalEmotes);
      logEmptyEmoteResponse('BTTV', 'channel', bttvChannelEmotes);
      logEmptyEmoteResponse('FFZ', 'channel', ffzChannelEmotes);
      logEmptyEmoteResponse('FFZ', 'global', ffzGlobalEmotes);

      logEmptyBadgeResponse('Twitch', 'global', twitchGlobalBadges);
      logEmptyBadgeResponse('Twitch', 'channel', twitchChannelBadges);
      logEmptyBadgeResponse('FFZ', 'global', ffzGlobalBadges);

      set(state => ({
        ...state,
        status: 'fulfilled',
        twitchChannelEmotes: getValue<SanitisiedEmoteSet>(twitchChannelEmotes),
        twitchGlobalEmotes: getValue<SanitisiedEmoteSet>(twitchGlobalEmotes),
        sevenTvChannelEmotes:
          getValue<SanitisiedEmoteSet>(sevenTvChannelEmotes),
        sevenTvGlobalEmotes: getValue<SanitisiedEmoteSet>(sevenTvGlobalEmotes),
        bttvGlobalEmotes: getValue<SanitisiedEmoteSet>(bttvGlobalEmotes),
        bttvChannelEmotes: getValue<SanitisiedEmoteSet>(bttvChannelEmotes),
        ffzChannelEmotes: getValue<SanitisiedEmoteSet>(ffzChannelEmotes),
        ffzGlobalEmotes: getValue<SanitisiedEmoteSet>(ffzGlobalEmotes),
        twitchChannelBadges: getValue<SanitisedBadgeSet>(twitchChannelBadges),
        twitchGlobalBadges: getValue<SanitisedBadgeSet>(twitchGlobalBadges),
        ffzGlobalBadges: getValue<SanitisedBadgeSet>(ffzGlobalBadges),
        ffzChannelBadges: getValue<SanitisedBadgeSet>(ffzChannelBadges),
        chatterinoBadges: getValue<SanitisedBadgeSet>(chatterinoBadges),
      }));

      return true;
    } catch (error) {
      logger.chat.error('Error loading channel resources:', error);
      set(state => ({ ...state, status: 'error' }));
      return false;
    }
  },

  messages: [],
  addMessage: (message: ChatMessageType) => {
    set(state => {
      const newMessages = [...state.messages, message];
      // Keep only the last 150 messages
      if (newMessages.length > 150) {
        newMessages.shift();
      }
      return {
        ...state,
        messages: newMessages,
      };
    });
  },
  clearMessages: () => {
    set(state => ({
      ...state,
      messages: [],
    }));
  },
});

export const useChatStore = create<ChatState>()(chatStoreCreator);

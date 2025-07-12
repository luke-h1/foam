/* eslint-disable no-param-reassign */
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
import { current } from 'immer';
import newRelic from 'newrelic-react-native-agent';
import { ViewStyle } from 'react-native';
import { ChatUserstate } from 'tmi.js';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { create, StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

export type ChatStatus = 'idle' | 'loading' | 'fulfilled' | 'error';

export interface ChatState {
  status: ChatStatus;

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
  setFfzChannelEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

  ffzGlobalEmotes: SanitisiedEmoteSet[];
  setFfzGlobalEmotes: (emoteSet: SanitisiedEmoteSet[]) => void;

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
  setTTvUsers: (user: ChatUser[]) => void;

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

const chatStoreCreator: StateCreator<
  ChatState,
  [['zustand/immer', never]],
  [['zustand/immer', never]]
> = set => ({
  status: 'idle',
  setBits: bits => {
    set(state => {
      state.bits = bits;
    });
  },

  /**
   * Chatters
   */
  ttvUsers: [],
  setTTvUsers: users => {
    set(state => {
      const uniqueUsersMap = new Map(
        state.ttvUsers.map(user => [user.userId, user]),
      );

      // Update or add new users
      users.forEach(user => {
        uniqueUsersMap.set(user.userId, user);
      });

      // Convert map back to array
      state.ttvUsers = Array.from(uniqueUsersMap.values());
    });
  },

  /**
   * Placeholder for chatterino emotes
   */
  emojis: [],
  setEmojis: emoteSet => {
    set(state => {
      state.emojis = emoteSet;
    });
  },

  /**
   * Twitch
   */
  twitchChannelEmotes: [],
  bits: [],
  twitchGlobalEmotes: [],
  setTwitchChannelEmotes: emoteSet => {
    set(state => {
      state.twitchChannelEmotes = emoteSet;
    });
  },
  setTwitchGlobalEmotes: emoteSet => {
    set(state => {
      state.twitchGlobalEmotes = emoteSet;
    });
  },

  /**
   * FFZ
   */
  ffzChannelEmotes: [],
  ffzGlobalEmotes: [],
  setFfzChannelEmotes: emoteSet => {
    set(state => {
      state.ffzChannelEmotes = emoteSet;
    });
  },
  setFfzGlobalEmotes: emoteSet => {
    set(state => {
      state.ffzGlobalEmotes = emoteSet;
    });
  },

  /**
   * Seven TV
   */
  sevenTvChannelEmotes: [],
  sevenTvGlobalEmotes: [],
  setSevenTvChannelEmotes: emoteSet => {
    set(state => {
      state.sevenTvChannelEmotes = emoteSet;
    });
  },
  setSevenTvGlobalEmotes: emoteSet => {
    set(state => {
      state.sevenTvGlobalEmotes = emoteSet;
    });
  },

  /**
   * BTTV
   */
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],
  setBttvChannelEmotes: emoteSet => {
    set(state => {
      state.bttvChannelEmotes = emoteSet;
    });
  },

  setBttvGlobalEmotes: emoteSet => {
    set(state => {
      state.bttvGlobalEmotes = emoteSet;
    });
  },

  /**
   * Twitch Badges
   */
  twitchGlobalBadges: [],
  setTwitchGlobalBadges: badgeSet => {
    set(state => {
      state.twitchGlobalBadges = badgeSet;
    });
  },

  twitchChannelBadges: [],
  setTwitchChannelBadges: badgeSet => {
    set(state => {
      state.twitchChannelBadges = badgeSet;
    });
  },

  /**
   * FFZ badges
   */
  ffzGlobalBadges: [],
  setFfzGlobalBadges: badgeSet => {
    set(state => {
      state.ffzGlobalBadges = badgeSet;
    });
  },
  ffzChannelBadges: [],
  setFfzChannelBadges: badgeSet => {
    set(state => {
      state.ffzChannelBadges = badgeSet;
    });
  },

  chatterinoBadges: [],
  setChatterinoBadges: badgeSet => {
    set(state => {
      state.chatterinoBadges = badgeSet;
    });
  },

  clearChannelResources: () => {
    set(state => {
      state.status = 'idle';
      // Keep global emotes loaded for performance
      state.twitchChannelEmotes = [];
      // state.twitchGlobalEmotes = []; // Keep global emotes
      state.ffzChannelEmotes = [];
      // state.ffzGlobalEmotes = []; // Keep global emotes
      state.sevenTvChannelEmotes = [];
      // state.sevenTvGlobalEmotes = []; // Keep global emotes
      state.emojis = [];
      state.ttvUsers = [];
      state.bits = [];
      state.twitchChannelBadges = [];
      state.twitchGlobalBadges = [];
      state.ffzGlobalBadges = [];
      state.ffzChannelBadges = [];
      state.chatterinoBadges = [];
    });
  },
  loadChannelResources: async (channelId: string) => {
    set(state => {
      state.status = 'loading';
    });
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

      set(state => {
        state.status = 'fulfilled';
        state.twitchChannelEmotes =
          getValue<SanitisiedEmoteSet>(twitchChannelEmotes);
        state.twitchGlobalEmotes =
          getValue<SanitisiedEmoteSet>(twitchGlobalEmotes);
        state.sevenTvChannelEmotes =
          getValue<SanitisiedEmoteSet>(sevenTvChannelEmotes);
        state.sevenTvGlobalEmotes =
          getValue<SanitisiedEmoteSet>(sevenTvGlobalEmotes);
        state.bttvGlobalEmotes = getValue<SanitisiedEmoteSet>(bttvGlobalEmotes);
        state.bttvChannelEmotes =
          getValue<SanitisiedEmoteSet>(bttvChannelEmotes);
        state.ffzChannelEmotes = getValue<SanitisiedEmoteSet>(ffzChannelEmotes);
        state.ffzGlobalEmotes = getValue<SanitisiedEmoteSet>(ffzGlobalEmotes);
        state.twitchChannelBadges =
          getValue<SanitisedBadgeSet>(twitchChannelBadges);
        state.twitchGlobalBadges =
          getValue<SanitisedBadgeSet>(twitchGlobalBadges);
        state.ffzGlobalBadges = getValue<SanitisedBadgeSet>(ffzGlobalBadges);
        state.ffzChannelBadges = getValue<SanitisedBadgeSet>(ffzChannelBadges);
        state.chatterinoBadges = getValue<SanitisedBadgeSet>(chatterinoBadges);
      });

      return true;
    } catch (error) {
      logger.chat.error('Error loading channel resources:', error);
      set(state => {
        state.status = 'error';
      });
      return false;
    }
  },

  messages: [],
  addMessage: (message: ChatMessageType) => {
    set(state => {
      const currentMessages = current(state.messages);
      const newMessages = [...currentMessages, message];
      // Keep only the last 150 messages
      if (newMessages.length > 150) {
        newMessages.shift();
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      state.messages = newMessages;
    });
  },
  clearMessages: () => {
    set(state => {
      state.messages = [];
    });
  },
});

export const useChatStore = create<ChatState>()(immer(chatStoreCreator));

export const useChatStoreWithSelector = <T>(
  selector: (state: ChatState) => T,
  equalityFn?: (a: T, b: T) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    useChatStore.subscribe,
    useChatStore.getState,
    useChatStore.getState,
    selector,
    equalityFn,
  );
};

export const useEmotesSelector = () => {
  return useChatStoreWithSelector(
    state => ({
      twitchChannelEmotes: state.twitchChannelEmotes,
      twitchGlobalEmotes: state.twitchGlobalEmotes,
      sevenTvChannelEmotes: state.sevenTvChannelEmotes,
      sevenTvGlobalEmotes: state.sevenTvGlobalEmotes,
      bttvChannelEmotes: state.bttvChannelEmotes,
      bttvGlobalEmotes: state.bttvGlobalEmotes,
      ffzChannelEmotes: state.ffzChannelEmotes,
      ffzGlobalEmotes: state.ffzGlobalEmotes,
      emojis: state.emojis,
    }),
    (a, b) => {
      return (
        a.twitchChannelEmotes === b.twitchChannelEmotes &&
        a.twitchGlobalEmotes === b.twitchGlobalEmotes &&
        a.sevenTvChannelEmotes === b.sevenTvChannelEmotes &&
        a.sevenTvGlobalEmotes === b.sevenTvGlobalEmotes &&
        a.bttvChannelEmotes === b.bttvChannelEmotes &&
        a.bttvGlobalEmotes === b.bttvGlobalEmotes &&
        a.ffzChannelEmotes === b.ffzChannelEmotes &&
        a.ffzGlobalEmotes === b.ffzGlobalEmotes &&
        a.emojis === b.emojis
      );
    },
  );
};

export const useBadgesSelector = () => {
  return useChatStoreWithSelector(
    state => ({
      twitchGlobalBadges: state.twitchGlobalBadges,
      twitchChannelBadges: state.twitchChannelBadges,
      ffzGlobalBadges: state.ffzGlobalBadges,
      ffzChannelBadges: state.ffzChannelBadges,
      chatterinoBadges: state.chatterinoBadges,
    }),
    (a, b) => {
      return (
        a.twitchGlobalBadges === b.twitchGlobalBadges &&
        a.twitchChannelBadges === b.twitchChannelBadges &&
        a.ffzGlobalBadges === b.ffzGlobalBadges &&
        a.ffzChannelBadges === b.ffzChannelBadges &&
        a.chatterinoBadges === b.chatterinoBadges
      );
    },
  );
};

export const useMessagesSelector = () => {
  return useChatStoreWithSelector(
    state => state.messages,
    (a, b) =>
      a.length === b.length && a.every((msg, index) => msg === b[index]),
  );
};

export const useChatUsersSelector = () => {
  return useChatStoreWithSelector(
    state => state.ttvUsers,
    (a, b) =>
      a.length === b.length && a.every((user, index) => user === b[index]),
  );
};

export const useChatStatusSelector = () => {
  return useChatStoreWithSelector(
    state => state.status,
    (a, b) => a === b,
  );
};

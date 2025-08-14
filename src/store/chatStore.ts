import {
  bttvEmoteService,
  ffzService,
  SanitisedBadgeSet,
  SanitisiedEmoteSet,
  sevenTvService,
  twitchBadgeService,
  twitchEmoteService,
} from '@app/services';
import { chatterinoService } from '@app/services/chatterino-service';
import { ParsedPart } from '@app/utils';
import { logger } from '@app/utils/logger';
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

export type ChatStatus = 'idle' | 'loading' | 'fulfilled' | 'error';

export interface ChatState {
  status: ChatStatus;

  /**
   * Emojis
   */
  emojis: SanitisiedEmoteSet[];

  /**
   * Bits
   */
  bits: Bit[];
  setBits: (bits: Bit[]) => void;

  /**
   * Twitch emotes
   */
  twitchChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * 7TV emotes
   */
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * FFZ emomtes
   */
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];

  /**
   * BTTV emotes
   */
  bttvGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];

  /**
   * Chat users
   */
  ttvUsers: ChatUser[];
  addTtvUser: (user: ChatUser) => void;

  /**
   * Twitch badges
   */
  twitchGlobalBadges: SanitisedBadgeSet[];
  twitchChannelBadges: SanitisedBadgeSet[];

  /**
   * FFZ badges
   */
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];

  /**
   * Chatterino badges
   */
  chatterinoBadges: SanitisedBadgeSet[];

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
  clearTtvUsers: () => void;
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
   * Chatters
   */
  ttvUsers: [],
  addTtvUser: user => {
    return set(state => {
      const uniqueUsersMap = new Map(
        // eslint-disable-next-line no-shadow
        state.ttvUsers.map(user => [user.userId, user]),
      );

      uniqueUsersMap.set(user.userId, user);

      return {
        ...state,
        ttvUsers: Array.from(uniqueUsersMap.values()),
      };
    });
  },

  clearTtvUsers: () => {
    return set(state => {
      return {
        ...state,
        ttvUsers: [],
      };
    });
  },

  /**
   * Placeholder for chatterino emotes
   */
  emojis: [],

  /**
   * Twitch
   */
  twitchChannelEmotes: [],
  twitchGlobalEmotes: [],

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

  /**
   * BTTV
   */
  bttvChannelEmotes: [],
  bttvGlobalEmotes: [],

  /**
   * Twitch Badges
   */
  twitchGlobalBadges: [],

  twitchChannelBadges: [],

  /**
   * FFZ badges
   */
  ffzGlobalBadges: [],
  ffzChannelBadges: [],

  chatterinoBadges: [],

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
          logger.api.warn(message);
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
          logger.api.warn(message);
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

      // const directory = new Directory(Paths.cache, createId());

      // directory.create();

      // const assets = await Promise.all(
      //   urls.map(async url => {
      //     const file = await File.downloadFileAsync(url, directory);

      //     return MediaLibrary.createAssetAsync(file.uri);
      //   }),
      // );

      // const album = await getAppAlbum();
      // await MediaLibrary.addAssetsToAlbumAsync(compact(assets), album);
      // directory.delete();

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

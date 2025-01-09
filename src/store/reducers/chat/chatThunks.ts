/* eslint-disable no-param-reassign */
import bttvService from '@app/services/bttvService';
import chatterinoService from '@app/services/chatterinoService';
import ffzService from '@app/services/ffzService';
import recentMessageService from '@app/services/recentMessageService';
import stvService from '@app/services/stvService';
import twitchService from '@app/services/twitchService';
import { AppThunk, RootState } from '@app/store';
import {
  ActionReducerMapBuilder,
  AsyncThunkPayloadCreator,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { PrivateMessage, UserNotice } from '@twurple/chat';
import { MessageTypes } from 'ircv3';
import { messageReceived } from './chatReducer';
import {
  parseBttvChannelEmotes,
  parseBttvGlobalBadges,
  parseBttvGlobalEmotes,
} from './parsers/bttvParser';
import { parseChatterinoBadges } from './parsers/chatterinoParser';
import {
  parseFfzApGlobalBadges,
  parseFfzChannelEmotes,
  parseFfzEmoji,
  parseFfzGlobalBadges,
  parseFfzGlobalEmotes,
} from './parsers/ffzParser';
import {
  parseStvChannelEmotes,
  parseStvGlobalEmotes,
} from './parsers/stvParser';
import { parseTwitchBadges, parseTwitchEmotes } from './parsers/twitchParser';
import { Channel, ChatState, FetchResult } from './types';
import {
  createNotice,
  createOwnMessage,
  createPrivateMessage,
  createUserNotice,
} from './util/createMessages';
import { writeEmotesUsageStatistics } from './util/emoteUsageStatistics';

const builderFns: ((builder: ActionReducerMapBuilder<ChatState>) => void)[] =
  [];

export const registerChatThunks = (
  builder: ActionReducerMapBuilder<ChatState>,
) => builderFns.forEach(fn => fn(builder));

interface CreateGlobalChatThunkArgs<TResult> {
  name: string;
  path: (state: ChatState) => FetchResult<TResult>;
  payloadCreator: AsyncThunkPayloadCreator<TResult, void>;
}

/**
 * Global chat
 */
const createGlobalChatThunk = <TResult>({
  name,
  path,
  payloadCreator,
}: CreateGlobalChatThunkArgs<TResult>) => {
  const thunk = createAsyncThunk(`chat/${name}`, payloadCreator);

  builderFns.push((builder: ActionReducerMapBuilder<ChatState>) => {
    builder.addCase(thunk.pending, state => {
      path(state).status = 'pending';
    });
    builder.addCase(thunk.rejected, (state, { error }) => {
      path(state).status = 'rejected';
      // eslint-disable-next-line no-console
      console.warn(error.message);
    });
    builder.addCase(thunk.fulfilled, (state, { payload }) => {
      path(state).status = 'fulfilled';
      path(state).data = payload;
    });
  });
  return thunk;
};

interface FetchChannelThunkArg {
  channelId: string;
  channelName: string;
}

interface CreateChannelChatThunkArgs<TResult> {
  name: string;
  path: (channel: Channel) => FetchResult<TResult>;
  payloadCreator: AsyncThunkPayloadCreator<
    { data: TResult; channelName: string },
    FetchChannelThunkArg
  >;
}

/**
 * channel chat
 */
const createChannelChatThunk = <TResult>({
  name,
  path,
  payloadCreator,
}: CreateChannelChatThunkArgs<TResult>) => {
  const thunk = createAsyncThunk(`chat/${name}`, payloadCreator);

  builderFns.push((builder: ActionReducerMapBuilder<ChatState>) => {
    builder.addCase(thunk.pending, (state, { meta: { arg } }) => {
      const channel = state.channels.entities[arg.channelName];
      if (!channel) return;
      path(channel).status = 'pending';
    });
    builder.addCase(thunk.rejected, (state, { meta: { arg }, error }) => {
      const channel = state.channels.entities[arg.channelName];
      if (!channel) return;
      path(channel).status = 'rejected';
      // eslint-disable-next-line no-console
      console.warn(error.message);
    });
    builder.addCase(thunk.fulfilled, (state, { meta: { arg }, payload }) => {
      const channel = state.channels.entities[arg.channelName];
      if (!channel) return;
      path(channel).status = 'fulfilled';
      path(channel).data = payload.data;
    });
  });

  return thunk;
};

/**
 * Recent messages
 */
export const fetchRecentMessages = (() => {
  const thunk = createAsyncThunk(
    'chat/fetchRecentMessages',
    (channelName: string) =>
      recentMessageService.listRecentMessages(channelName),
  );

  builderFns.push((builder: ActionReducerMapBuilder<ChatState>) => {
    builder.addCase(thunk.pending, (state, { meta: { arg } }) => {
      const channel = state.channels.entities[arg];
      if (!channel) return;
      channel.recentMessages.status = 'pending';
    });
    builder.addCase(thunk.rejected, (state, { meta: { arg }, error }) => {
      const channel = state.channels.entities[arg];
      if (!channel) return;
      channel.recentMessages.status = 'rejected';
      console.warn(error.message);
    });
    builder.addCase(thunk.fulfilled, (state, { meta: { arg }, payload }) => {
      const channel = state.channels.entities[arg];
      if (!channel) return;
      channel.recentMessages.status = 'fulfilled';

      let rawMessages = payload.messages;
      const { messagesLimit } = state.options.ui;
      const messagesLength = channel.messages.length;
      const exceededMessages =
        rawMessages.length - messagesLimit + messagesLength;

      if (exceededMessages > 0) {
        rawMessages = payload.messages.slice(exceededMessages);
      }

      // const messages = createHistoryMessages(rawMessages, {
      //   chat: state,
      // } as RootState);
      // channel.messages = [...messages, ...channel.messages];

      const messages = [channel.messages];

      // if we added odd number of messages, invert altBg
      if (messages.length % 2 !== 0) {
        channel.isFirstMessageAltBg = !channel.isFirstMessageAltBg;
      }
    });
  });
  return thunk;
})();

/**
 * Global emotes
 */
export const fetchAndMergeTwitchEmotes = (() => {
  const thunk = createAsyncThunk(
    'chat/fetchAndMergeTwitchEmotes',
    async (_, { getState }) => {
      const state = getState() as RootState;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const channel = state.chat.currentChannel!;
      const fetchedIds = state.chat.emotes.twitch.setIds || [];
      // const globalIds = state.chat.me.globalUserState?.emoteSets || [];
      const globalIds = [''];
      const channelIds =
        state.chat.channels.entities[channel]?.userState?.emoteSets || [];
      const allIds = Array.from(new Set([...globalIds, ...channelIds]));
      const diffIds = allIds.filter(id => !fetchedIds.includes(id));
      if (diffIds.length === 0) return null;
      const response = await twitchService.listEmoteSets(diffIds);
      return {
        data: parseTwitchEmotes(response),
        setIds: [...fetchedIds, ...diffIds],
        template: response.template,
      };
    },
  );

  builderFns.push((builder: ActionReducerMapBuilder<ChatState>) => {
    builder.addCase(thunk.pending, state => {
      state.emotes.twitch.status = 'pending';
    });
    builder.addCase(thunk.rejected, (state, { error }) => {
      state.emotes.twitch.status = 'rejected';
      console.warn(error);
    });
    builder.addCase(thunk.fulfilled, (state, { payload }) => {
      const { twitch } = state.emotes;
      twitch.status = 'fulfilled';
      if (!payload) return;
      if (twitch.data) {
        twitch.data.entries = {
          ...twitch.data.entries,
          ...payload.data.entries,
        };
        twitch.data.names = {
          ...twitch.data.names,
          ...payload.data.names,
        };
      } else {
        twitch.data = payload.data;
      }
      twitch.setIds = payload.setIds;
      twitch.template = payload.template;
    });
  });

  return thunk;
})();

/**
 * Bttv global emotes
 */
export const fetchBttvGlobalEmotes = createGlobalChatThunk({
  name: 'fetchBttvGlobalEmotes',
  path: state => state.emotes.bttv,
  payloadCreator: () =>
    bttvService.listGlobalEmotes().then(parseBttvGlobalEmotes),
});

/**
 * FFZ global emotes
 */
export const fetchFfzGlobalEmotes = createGlobalChatThunk({
  name: 'fetchFfzGlobalEmotes',
  path: state => state.emotes.ffz,
  payloadCreator: () =>
    ffzService.listGlobalEmotes().then(parseFfzGlobalEmotes),
});

/**
 * 7tv global emotes
 */
export const fetchStvGlobalEmotes = createGlobalChatThunk({
  name: 'fetchStvGlobalEmotes',
  path: state => state.emotes.stv,
  payloadCreator: () =>
    stvService.listGlobalEmotes().then(parseStvGlobalEmotes),
});

/**
 * FFZ emoji
 */
export const fetchFfzEmoji = createGlobalChatThunk({
  name: 'fetchFfzEmoji',
  path: state => state.emotes.emoji,
  payloadCreator: () => ffzService.listEmoji().then(parseFfzEmoji),
});

/**
 * Global Twitch badges
 */
export const fetchTwitchGlobalBadges = createGlobalChatThunk({
  name: 'fetchTwitchGlobalBadges',
  path: state => state.badges.twitch,
  payloadCreator: async (_, { getState }) => {
    const response = await twitchService.listGlobalBadges();
    return parseTwitchBadges(response);
  },
});

/**
 * BTTV global badges
 */
export const fetchBttvGlobalBadges = createGlobalChatThunk({
  name: 'fetchBttvGlobalBadges',
  path: state => state.badges.bttv,
  payloadCreator: () =>
    bttvService.listGlobalBadges().then(parseBttvGlobalBadges),
});

/**
 * FFZ global badges
 */
export const fetchFfzGlobalBadges = createGlobalChatThunk({
  name: 'fetchFfzGlobalBadges',
  path: state => state.badges.ffz,
  payloadCreator: () =>
    ffzService.listGlobalBadges().then(parseFfzGlobalBadges),
});

/**
 * FFZ AP global badges
 */
export const fetchFfzApGlobalBadges = createGlobalChatThunk({
  name: 'fetchFfzApGlobalBadges',
  path: state => state.badges.ffzAp,
  payloadCreator: () =>
    ffzService.listApGlobalBadges().then(parseFfzApGlobalBadges),
});

// export const fetchStvGlobalBadges = createGlobalChatThunk({
//   name: "fetchStvGlobalBadges",
//   path: (state) => state.badges.stv,
//   payloadCreator: () =>
//     stvService.listCosmetics().then((r) => parseStvCosmetics(r).badges),
// });

/**
 * Chatterino badges
 */
export const fetchChatterinoGlobalBadges = createGlobalChatThunk({
  name: 'fetchChatterinoGlobalBadges',
  path: state => state.badges.chatterino,
  payloadCreator: () =>
    chatterinoService.listGlobalBadges().then(parseChatterinoBadges),
});

/**
 * BTTV channel emotes
 */
export const fetchBttvChannelEmotes = createChannelChatThunk({
  name: 'fetchBttvChannelEmotes',
  path: channel => channel.emotes.bttv,
  payloadCreator: ({ channelId, channelName }) =>
    bttvService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseBttvChannelEmotes(data), channelName })),
});

/**
 * FFZ channel emotes
 */
export const fetchFfzChannelEmotes = createChannelChatThunk({
  name: 'fetchFfzChannelEmotes',
  path: channel => channel.emotes.ffz,
  payloadCreator: ({ channelId, channelName }) =>
    ffzService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseFfzChannelEmotes(data), channelName })),
});

/**
 * STV channel emotes
 */
export const fetchStvChannelEmotes = createChannelChatThunk({
  name: 'fetchStvChannelEmotes',
  path: channel => channel.emotes.stv,
  payloadCreator: ({ channelId, channelName }) =>
    stvService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseStvChannelEmotes(data), channelName })),
});

/**
 * Twitch channel badges
 */
export const fetchTwitchChannelBadges = createChannelChatThunk({
  name: 'fetchTwitchChannelBadges',
  path: channel => channel.badges.twitch,
  payloadCreator: ({ channelId, channelName }) => {
    return twitchService
      .listChannelBadges(channelId)
      .then(data => ({ data: parseTwitchBadges(data), channelName }));
  },
});

/**
 * Messages
 */
export const privateMessageReceived =
  (msg: PrivateMessage): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    // sound on mention
    const message = createPrivateMessage(state)(msg);
    if (!message) return;
    // if (message.isHighlighted) playSound('tink');
    dispatch(messageReceived(message));
  };

export const userNoticeReceived =
  (msg: UserNotice): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    dispatch(messageReceived(createUserNotice(msg, state)));
  };

export const noticeReceived =
  (msg: MessageTypes.Commands.Notice): AppThunk =>
  dispatch => {
    dispatch(messageReceived(createNotice(msg)));
  };

export const messageSended =
  ({
    channelName,
    message,
  }: {
    channelName: string;
    message: string;
  }): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const m = createOwnMessage(channelName, message, state);
    writeEmotesUsageStatistics(m.parts);
    dispatch(messageReceived(m));
  };

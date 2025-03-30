/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
import { AppThunk, RootState } from '@app/store';
import {
  parseBttvChannelEmotes,
  parseBttvGlobalBadges,
  parseBttvGlobalEmotes,
} from '@app/store/parsers/bttvParsers';
import { parseChatterinoBadges } from '@app/store/parsers/chatterinoParsers';
import {
  parseFfzApGlobalBadges,
  parseFfzChannelEmotes,
  parseFfzEmoji,
  parseFfzGlobalBadges,
  parseFfzGlobalEmotes,
} from '@app/store/parsers/ffzParsers';
import {
  parseStvChannelEmotes,
  parseStvGlobalEmotes,
} from '@app/store/parsers/stvParsers';
import {
  parseBlockedUsers,
  parseTwitchBadges,
  parseTwitchEmotes,
} from '@app/store/parsers/twitchParsers';
import bttvService from '@app/store/services/bttvService';
import chatterinoService from '@app/store/services/chatterinoService';
import ffzService from '@app/store/services/ffzService';
import stvService from '@app/store/services/stvService';
import twitchService from '@app/store/services/twitchService';
import {
  createNotice,
  createOwnMessage,
  createPrivateMessage,
  createUserNotice,
} from '@app/store/util/createMessages';
import {
  ActionReducerMapBuilder,
  AsyncThunkPayloadCreator,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { PrivateMessage, UserNotice } from '@twurple/chat';
import { MessageTypes } from 'ircv3';
import { messageReceived } from './slice';
import { Channel, ChatState, FetchResult } from './types';

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

// blocked users
export const fetchBlockedUsers = createGlobalChatThunk({
  name: 'fetchBlockedUsers',
  path: state => state.me.blockedUsers,
  payloadCreator: (_, { getState }) => {
    const state = getState() as RootState;
    const { id, accessToken } = state.chat.me;

    return twitchService
      .listUserBlockList(id as string, accessToken as string)
      .then(parseBlockedUsers);
  },
});

// recent messages
export const fetchRecentMessages = (() => {
  const thunk = createAsyncThunk(
    'chat/fetchRecentMessages',
    (channelName: string) => [],
    // recentMessageService.listRecentMessages(channelName),
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

// global emotes
export const fetchAndMergeTwitchEmotes = (() => {
  const thunk = createAsyncThunk(
    'chat/fetchAndMergeTwitchEmotes',
    async (_, { getState }) => {
      const state = getState() as RootState;
      const accessToken = state.chat.me.accessToken!;
      const channel = state.chat.currentChannel!;
      const fetchedIds = state.chat.emotes.twitch.setIds || [];
      const globalIds = state.chat.me.globalUserState?.emoteSets || [];
      const channelIds =
        state.chat.channels.entities[channel]?.userState?.emoteSets || [];
      const allIds = Array.from(new Set([...globalIds, ...channelIds]));
      const diffIds = allIds.filter(id => !fetchedIds.includes(id));
      if (diffIds.length === 0) return null;
      const response = await twitchService.listEmoteSets(diffIds, accessToken);
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

// global emotes
export const fetchBttvGlobalEmotes = createGlobalChatThunk({
  name: 'fetchBttvGlobalEmotes',
  path: state => state.emotes.bttv,
  payloadCreator: () =>
    bttvService.listGlobalEmotes().then(parseBttvGlobalEmotes),
});
export const fetchFfzGlobalEmotes = createGlobalChatThunk({
  name: 'fetchFfzGlobalEmotes',
  path: state => state.emotes.ffz,
  payloadCreator: () =>
    ffzService.listGlobalEmotes().then(parseFfzGlobalEmotes),
});
export const fetchStvGlobalEmotes = createGlobalChatThunk({
  name: 'fetchStvGlobalEmotes',
  path: state => state.emotes.stv,
  payloadCreator: () =>
    stvService.listGlobalEmotes().then(parseStvGlobalEmotes),
});
export const fetchFfzEmoji = createGlobalChatThunk({
  name: 'fetchFfzEmoji',
  path: state => state.emotes.emoji,
  payloadCreator: () => ffzService.listEmoji().then(parseFfzEmoji),
});

// global badges
export const fetchTwitchGlobalBadges = createGlobalChatThunk({
  name: 'fetchTwitchGlobalBadges',
  path: state => state.badges.twitch,
  payloadCreator: async (_, { getState }) => {
    const state = getState() as RootState;
    const { accessToken } = state.chat.me;
    const response = await twitchService.listGlobalBadges(
      accessToken as string,
    );
    return parseTwitchBadges(response);
  },
});
export const fetchBttvGlobalBadges = createGlobalChatThunk({
  name: 'fetchBttvGlobalBadges',
  path: state => state.badges.bttv,
  payloadCreator: () =>
    bttvService.listGlobalBadges().then(parseBttvGlobalBadges),
});
export const fetchFfzGlobalBadges = createGlobalChatThunk({
  name: 'fetchFfzGlobalBadges',
  path: state => state.badges.ffz,
  payloadCreator: () =>
    ffzService.listGlobalBadges().then(parseFfzGlobalBadges),
});
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
export const fetchChatterinoGlobalBadges = createGlobalChatThunk({
  name: 'fetchChatterinoGlobalBadges',
  path: state => state.badges.chatterino,
  payloadCreator: () =>
    chatterinoService.listGlobalBadges().then(parseChatterinoBadges),
});

// channel emotes
export const fetchBttvChannelEmotes = createChannelChatThunk({
  name: 'fetchBttvChannelEmotes',
  path: channel => channel.emotes.bttv,
  payloadCreator: ({ channelId, channelName }) =>
    bttvService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseBttvChannelEmotes(data), channelName })),
});
export const fetchFfzChannelEmotes = createChannelChatThunk({
  name: 'fetchFfzChannelEmotes',
  path: channel => channel.emotes.ffz,
  payloadCreator: ({ channelId, channelName }) =>
    ffzService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseFfzChannelEmotes(data), channelName })),
});
export const fetchStvChannelEmotes = createChannelChatThunk({
  name: 'fetchStvChannelEmotes',
  path: channel => channel.emotes.stv,
  payloadCreator: ({ channelId, channelName }) =>
    stvService
      .listChannelEmotes(channelId)
      .then(data => ({ data: parseStvChannelEmotes(data), channelName })),
});

// channel badges
export const fetchTwitchChannelBadges = createChannelChatThunk({
  name: 'fetchTwitchChannelBadges',
  path: channel => channel.badges.twitch,
  payloadCreator: ({ channelId, channelName }, { getState }) => {
    const state = getState() as RootState;
    const { accessToken } = state.chat.me;
    return twitchService
      .listChannelBadges(channelId, accessToken as string)
      .then(data => ({ data: parseTwitchBadges(data), channelName }));
  },
});

// messages
export const privateMessageReceived =
  (msg: PrivateMessage): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    // sound on mention
    const message = createPrivateMessage(state)(msg);
    if (!message) return;
    if (message.isHighlighted) {
      console.log('message highlight');
    }
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
    // writeEmotesUsageStatistic(m.parts);
    dispatch(messageReceived(m));
  };

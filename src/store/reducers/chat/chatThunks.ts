/* eslint-disable no-param-reassign */
import {
  ActionReducerMapBuilder,
  AsyncThunkPayloadCreator,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { Channel, ChatState, FetchResult } from './types';
import recentMessageService from '@app/services/recentMessageService';
import { RootState } from '@app/store';
import { useAuthContext } from '@app/context/AuthContext';
import twitchService from '@app/services/twitchService';

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
function parseTwitchEmotes(response: {
  data: import('../../../services/types/generated/twitch.generated').components['schemas']['Emote'][];
  template: string;
}): any {
  throw new Error('Function not implemented.');
}

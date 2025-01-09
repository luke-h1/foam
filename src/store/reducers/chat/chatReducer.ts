/* eslint-disable no-param-reassign */
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import {
  CHANNEL_INITIAL_STATE,
  CHANNEL_RECENT_INPUTS_LIMIT,
  CHANNEL_USERS_LIMIT,
} from './config';
import {
  Channel,
  ChatState,
  GlobalUserStateTags,
  LocalStorageChannels,
  RoomStateTags,
  UserStateTags,
} from './types';
import getInitialOptions from './util/options/getInitialOptions';
import {
  createBadges,
  createCard,
  createParts,
  createParts,
} from './util/createMessages';
import {
  MessageType,
  MessageTypeNotice,
  MessageTypePrivate,
  MessageTypeUserNotice,
} from './util/messages/types/messages';

const channelsAdapter = createEntityAdapter<Channel>({
  // @ts-expect-error - work out why selectId doesn't exist but it does in the docs??
  selectId: (channel: Channel) => channel.name,
});

const initialState: ChatState = {
  isConnected: false,
  isRegistered: false,
  channels: channelsAdapter.getInitialState(),
  emotes: {
    twitch: { status: 'idle' },
    bttv: { status: 'idle' },
    ffz: { status: 'idle' },
    stv: { status: 'idle' },
    emoji: { status: 'idle' },
  },
  badges: {
    twitch: { status: 'idle' },
    bttv: { status: 'idle' },
    ffz: { status: 'idle' },
    ffzAp: { status: 'idle' },
    stv: { status: 'idle' },
    chatterino: { status: 'idle' },
  },
  options: getInitialOptions(),
};

interface OptionChangedPayload {
  section: keyof ChatState['options'];
  name: string;
  value: unknown;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /*
     * Fired when a user connects to a chat
     */
    chatConnected: state => {
      state.isConnected = true;
    },

    /**
     * Fired when a user leaves a stream
     */
    chatDisconnected: state => {
      state.isConnected = false;
      state.isRegistered = false;
    },

    /**
     * Fired when we are connecting to the chat ws
     */
    chatRegistered: state => {
      state.isRegistered = true;
    },

    /**
     * Fired when we load a channel
     */
    channelsInitialized: (
      state,
      { payload }: PayloadAction<LocalStorageChannels>,
    ) => {
      channelsAdapter.addMany(
        state.channels,
        payload.map(
          ([name, id]): Channel => ({
            ...CHANNEL_INITIAL_STATE,
            id: id as string,
            name,
          }),
        ),
      );
    },

    /**
     * Fired when a channel is added to a chat
     */
    channelAdded: (state, { payload }: PayloadAction<string>) => {
      if (!state.currentChannel) {
        state.currentChannel = payload;
      }

      channelsAdapter.addOne(state.channels, {
        name: payload,
        ...CHANNEL_INITIAL_STATE,
      });
    },

    /**
     * Fired when we disconnect from a channel
     */
    channelRemoved: (state, { payload }: PayloadAction<string>) => {
      channelsAdapter.removeOne(state.channels, payload);

      if (state.currentChannel === payload) {
        state.currentChannel = state.channels.ids[0] as string;
      }
    },

    /**
     * Fired when a user swaps to a new tab chat
     */
    currentChannelChanged: (state, { payload }: PayloadAction<string>) => {
      state.currentChannel = payload;
    },

    /**
     * Loads all resources for a given channel:
     * emotes
     * badges
     * paints/cosmetics
     * preview cards - yt,twitch,streamable etc.
     * filters msgs from blocked users
     */
    channelResourcesLoaded: state => {
      const channel = state.channels.entities[state.currentChannel as string];

      if (!channel) {
        // eslint-disable-next-line no-useless-return
        return;
      }
      channel.ready = true;

      const dummyState = { chat: state };

      const createdBadges = createBadges(dummyState);
      const createdParts = createParts(dummyState);
      const createdCard = createCard(dummyState);
      const blockedUsers = [''];

      const filteredMessages = channel.messages.filter(
        msg =>
          !(
            msg.type === MessageType.PRIVATE_MESSAGE &&
            blockedUsers.includes(msg.user.login)
          ),
      );

      if (channel.messages.length % 2 !== filteredMessages.length % 2) {
        channel.isFirstMessageAltBg = !channel.isFirstMessageAltBg;
      }
      if (channel.messages.length !== filteredMessages.length) {
        channel.messages = filteredMessages;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const message of channel.messages) {
        if (
          message.type !== MessageType.PRIVATE_MESSAGE &&
          message.type !== MessageType.USER_NOTICE
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }
        // eslint-disable-next-line no-underscore-dangle
        message.parts = createdParts(message.body, message._tags.emotes);
        // eslint-disable-next-line no-underscore-dangle
        message.badges = createdBadges(message.user.id, message._tags.badges);
        if (message.type === MessageType.PRIVATE_MESSAGE) {
          message.card = createdCard(message.parts);
        }
      }
    },
    globalUserStateReceived: (
      state,
      { payload }: PayloadAction<GlobalUserStateTags>,
    ) => {
      // state.me.globalUserState = payload
      console.log('globalUserStateReceived');
    },
    userStateReceived: (
      state,
      {
        payload,
      }: PayloadAction<{ channelName: string; userState: UserStateTags }>,
    ) => {
      const channel = state.channels.entities[payload.channelName];
      if (!channel) {
        return;
      }
      channel.userState = payload.userState;
    },
    roomStateReceived: (
      state,
      {
        payload,
      }: PayloadAction<{ channelName: string; roomState: RoomStateTags }>,
    ) => {
      const channel = state.channels.entities[payload.channelName];
      if (!channel) {
        return;
      }
      channel.roomState = payload.roomState;
      channel.id = payload.roomState.roomId;
    },

    // chat messages
    messageReceived: (
      state,
      {
        payload,
      }: PayloadAction<
        MessageTypePrivate | MessageTypeUserNotice | MessageTypeNotice
      >,
    ) => {
      const channel = state.channels.entities[payload.channelName];
      if (!channel) {
        return;
      }
      channel.messages.push(payload);
      const { messagesLimit } = state.options.ui;
      if (channel.messages.length > messagesLimit) {
        channel.isFirstMessageAltBg = !channel.isFirstMessageAltBg;
        channel.messages.shift();
      }
      // users
      if (
        payload.type === MessageType.PRIVATE_MESSAGE &&
        !channel.users.includes(payload.user.login)
      ) {
        channel.users.push(payload.user.login);
        if (channel.users.length > CHANNEL_USERS_LIMIT) {
          channel.users.shift();
        }
      }
      // recentInputs
      if (payload.type === MessageType.PRIVATE_MESSAGE && payload.isSelf) {
        // prevent adding the same message
        if (
          channel.recentInputs[channel.recentInputs.length - 1] !== payload.body
        ) {
          channel.recentInputs.push(payload.body);
          if (channel.recentInputs.length > CHANNEL_RECENT_INPUTS_LIMIT) {
            channel.recentInputs.shift();
          }
        }
      }
    },
    clearChatReceived: (
      state,
      { payload }: PayloadAction<{ channelName: string; login?: string }>,
    ) => {
      const channel = state.channels.entities[payload.channelName];
      if (!channel) {
        return;
      }
      if (payload.login) {
        // /ban or /timeout is used
        // eslint-disable-next-line no-restricted-syntax
        for (const message of channel.messages) {
          if (
            message.type === MessageType.PRIVATE_MESSAGE &&
            message.user.login === payload.login
          ) {
            message.isDeleted = true;
          }
        }
      } else {
        // /clear
        // eslint-disable-next-line no-restricted-syntax
        for (const message of channel.messages) {
          if (message.type === MessageType.PRIVATE_MESSAGE) {
            message.isHistory = true;
          }
        }
      }
    },
    clearMsgReceived: (
      state,
      { payload }: PayloadAction<{ channelName: string; messageId: string }>,
    ) => {
      const channel = state.channels.entities[payload.channelName];
      if (!channel) {
        return;
      }
      const message = channel.messages.find(
        m =>
          m.type === MessageType.PRIVATE_MESSAGE && m.id === payload.messageId,
      );
      if (message) {
        (message as MessageTypePrivate).isDeleted = true;
      }
    },

    // options
  },
});

export const {
  channelAdded,
  channelRemoved,
  channelResourcesLoaded,
  channelsInitialized,
  chatConnected,
  chatDisconnected,
  chatRegistered,
  currentChannelChanged,
} = chatSlice.actions;

export default chatSlice.reducer;

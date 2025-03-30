/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { RootState } from '@app/store';
import {
  MessageType,
  MessageTypePrivate,
  MessageTypeUserNotice,
  MessageTypeNotice,
} from '@app/store/services/types/messages';
import {
  createCreateBadges,
  createCreateCard,
  createCreateParts,
} from '@app/store/util/createMessages';
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import {
  CHANNEL_INITIAL_STATE,
  CHANNEL_USERS_LIMIT,
  CHANNEL_RECENT_INPUTS_LIMIT,
} from './config';
import { registerChatThunks } from './thunks';
import {
  ChatState,
  LocalStorageChannels,
  GlobalUserStateTags,
  UserStateTags,
  RoomStateTags,
} from './types';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const channelsAdapter = createEntityAdapter<Channel>({
  selectId: channel => channel.name,
});

const initialState: ChatState = {
  isConnected: false,
  isRegistered: false,
  me: {
    authStatus: 'uninitialized',
    blockedUsers: { status: 'idle' },
  },
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
  options: {
    ui: { messagesLimit: 50, splitChat: false, timestampFormat: 'H:mm' },
    notifications: { highlightKeywords: '', mentions: false },
    recentMessages: { load: false },
    twitch: { animatedEmotes: true, cards: true },
    bttv: { badges: true, emotes: true },
    ffz: { badges: true, emoji: true, emotes: true },
    stv: { badges: true, emotes: true },
    chatterino: {
      badges: true,
    },
    youtube: {
      cards: false,
    },
  },
};

type AuthStatusChangedPayload =
  | ({
      authStatus: 'success';
    } & Pick<
      ChatState['me'],
      'id' | 'login' | 'displayName' | 'picture' | 'accessToken'
    >)
  | { authStatus: 'error' };

type OptionChangedPayload = {
  section: keyof ChatState['options'];
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

const chat = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // auth
    authStatusChanged: (
      state,
      { payload }: PayloadAction<AuthStatusChangedPayload>,
    ) => {
      if (payload.authStatus === 'success') {
        state.me.authStatus = payload.authStatus;
        state.me.id = payload.id;
        state.me.login = payload.login;
        state.me.displayName = payload.displayName;
        state.me.picture = payload.picture;
        state.me.accessToken = payload.accessToken;
      }
      if (payload.authStatus === 'error') {
        state.me.authStatus = payload.authStatus;
        state.me.id = undefined;
        state.me.login = undefined;
        state.me.displayName = undefined;
        state.me.picture = undefined;
        state.me.accessToken = undefined;
      }
    },
    // connection
    chatConnected: state => {
      state.isConnected = true;
    },
    chatDisconnected: state => {
      state.isConnected = false;
      state.isRegistered = false;
    },
    chatRegistered: state => {
      state.isRegistered = true;
    },
    // channels
    channelsInitialized: (
      state,
      { payload }: PayloadAction<LocalStorageChannels>,
    ) => {
      channelsAdapter.addMany(
        state.channels,
        payload.map(([name, id]) => ({
          ...CHANNEL_INITIAL_STATE,
          id,
          name,
        })),
      );
    },
    // add a channel to a chat
    channelAdded: (state, { payload }: PayloadAction<string>) => {
      if (!state.currentChannel) state.currentChannel = payload;
      channelsAdapter.addOne(state.channels, {
        name: payload,
        ...CHANNEL_INITIAL_STATE,
      });
    },
    // remove channel from a chat
    channelRemoved: (state, { payload }: PayloadAction<string>) => {
      channelsAdapter.removeOne(state.channels, payload);
      if (state.currentChannel === payload) {
        state.currentChannel = state.channels.ids[0] as string;
      }
    },
    // user has swapped to this chat
    currentChannelChanged: (state, { payload }: PayloadAction<string>) => {
      state.currentChannel = payload;
    },
    // load badges, emotes etc. for a given chat
    channelResourcesLoaded: state => {
      const channel = state.channels.entities[state.currentChannel!];
      if (!channel) {
        return;
      }
      channel.ready = true;
      // parse parts, badges, cards for all messages
      const dummyState = { chat: state } as RootState;
      const createBadges = createCreateBadges(dummyState);
      const createParts = createCreateParts(dummyState);
      const createCard = createCreateCard(dummyState);
      const blockedUsers = state.me.blockedUsers.data;
      const filteredMessages = channel.messages.filter(
        m =>
          !(
            m.type === MessageType.PRIVATE_MESSAGE &&
            blockedUsers?.includes(m.user.login)
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
        message.parts = createParts(message.body, message._tags.emotes);
        message.badges = createBadges(message.user.id, message._tags.badges);
        if (message.type === MessageType.PRIVATE_MESSAGE) {
          message.card = createCard(message.parts);
        }
      }
    },
    globalUserStateReceived: (
      state,
      { payload }: PayloadAction<GlobalUserStateTags>,
    ) => {
      state.me.globalUserState = payload;
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
    optionChanged: {
      reducer: (
        state,
        {
          payload: { section, name, value },
        }: PayloadAction<OptionChangedPayload>,
      ) => {
        if (section === 'ui' && name === 'messagesLimit') {
          // eslint-disable-next-line no-restricted-syntax
          for (const channel of Object.values(state.channels.entities)) {
            if (!channel) continue;
            const exceededMessages = channel.messages.length - value;
            if (exceededMessages > 0) {
              channel.messages = channel.messages.slice(exceededMessages);
            }
          }
        }
      },
      prepare: (payload: OptionChangedPayload) => {
        if (payload.section === 'ui' && payload.name === 'messagesLimit') {
          payload.value = Number.parseInt(payload.value, 10);
        }
        // const options = storageService.get<Options>('options');
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // if (!options![payload.section]) options![payload.section] = {} as any;
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // (options![payload.section] as any)[payload.name] = payload.value;
        // storageService.set('options', options);
        return { payload };
      },
    },
  },
  extraReducers: registerChatThunks,
});

export const {
  authStatusChanged,

  chatConnected,
  chatDisconnected,
  chatRegistered,

  channelsInitialized,
  channelAdded,
  channelRemoved,
  currentChannelChanged,
  channelResourcesLoaded,

  globalUserStateReceived,
  userStateReceived,
  roomStateReceived,

  messageReceived,
  clearChatReceived,
  clearMsgReceived,

  optionChanged,
} = chat.actions;

export default chat.reducer;

/* eslint-disable no-param-reassign */
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Channel, ChatState, LocalStorageChannels } from './types';
import getInitialOptions from './util/options/getInitialOptions';
import { CHANNEL_INITIAL_STATE } from './config';

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
    },
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

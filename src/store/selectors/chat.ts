import { AuthState } from '@app/context/AuthContext';
import { RootState } from '..';

export const hasJoinedCurrentChannelSelector = (state: RootState) => {
  const channel =
    state.chat.channels.entities[state.chat.currentChannel as string];
  return channel?.userState && channel?.roomState;
};

export const fetchGlobalStatusSelector = (state: RootState) => ({
  emotes: {
    twitch: state.chat.emotes.twitch.status,
    bttv: state.chat.emotes.bttv.status,
    ffz: state.chat.emotes.ffz.status,
    emoji: state.chat.emotes.emoji.status,
    stv: state.chat.emotes.stv.status,
  },
  badges: {
    twitch: state.chat.badges.twitch.status,
    bttv: state.chat.badges.bttv.status,
    ffz: state.chat.badges.ffz.status,
    ffzAp: state.chat.badges.ffzAp.status,
    stv: state.chat.badges.stv.status,
    chatterino: state.chat.badges.chatterino.status,
  },
  blockedUsers: [],
});

export const fetchChannelStatusSelector = (state: RootState) => {
  const channel =
    state.chat.channels.entities[state.chat.currentChannel as string];

  return {
    emotes: {
      bttv: channel?.emotes.bttv.status,
      ffz: channel?.emotes.ffz.status,
      stv: channel?.emotes.stv.status,
    },
    badges: {
      twitch: channel?.badges.twitch.status,
    },
  };
};

export const isChannelReadySelector = (state: RootState) =>
  !!state.chat.channels.entities[state.chat.currentChannel as string]?.ready;

export const fetchRecentMessagesStatusSelector = (state: RootState) =>
  Object.values(state.chat.channels.entities).map(channel => ({
    name: channel?.name,
    status: channel?.recentMessages.status,
  }));

export const channelResourcesLoadedSelector = (
  state: RootState,
  authState: AuthState,
) => {
  const channel =
    state.chat.channels.entities[state.chat.currentChannel as string];
  if (!channel) return false;

  const { options } = state.chat;

  const statuses = [
    // authStatus === 'success' ? state.chat.me.blockedUsers.status : null,
    // a === 'success' ? [] : null,
    authState.isLoggedIn ? [] : null,
    // authStatus === 'success' ? state.chat.emotes.twitch.status : null,
    authState.isLoggedIn ? state.chat.emotes.twitch.status : null,
    options.bttv.emotes ? state.chat.emotes.bttv.status : null,
    options.ffz.emotes ? state.chat.emotes.ffz.status : null,
    options.stv.emotes ? state.chat.emotes.stv.status : null,
    options.ffz.emoji ? state.chat.emotes.emoji.status : null,
    state.chat.badges.twitch.status,
    options.bttv.badges ? state.chat.badges.bttv.status : null,
    options.ffz.badges ? state.chat.badges.ffz.status : null,
    options.ffz.badges ? state.chat.badges.ffzAp.status : null,
    options.stv.badges ? state.chat.badges.stv.status : null,
    options.chatterino.badges ? state.chat.badges.chatterino.status : null,
    options.bttv.emotes ? channel.emotes.bttv.status : null,
    options.ffz.emotes ? channel.emotes.ffz.status : null,
    options.stv.emotes ? channel.emotes.stv.status : null,
    channel.badges.twitch.status,
  ].filter(Boolean) as string[];

  return statuses.every(status => !['idle', 'pending'].includes(status));
};

export const currentChannelIdSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel as string]?.id;

export const currentChannelUsersSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel as string]?.users ||
  [];

export const currentChannelRecentInputsSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel as string]
    ?.recentInputs || [];

export const currentChannelMessagesSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel as string]?.messages ||
  [];

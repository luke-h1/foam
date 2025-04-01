/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { RootState } from '@app/store';

export const isConnectedSelector = (state: RootState) => state.chat.isConnected;

export const isRegisteredSelector = (state: RootState) =>
  state.chat.isRegistered;

export const channelNamesSelector = (state: RootState) =>
  state.chat.channels.ids as string[];

export const currentChannelNameSelector = (state: RootState) =>
  state.chat.currentChannel;

export const currentChannelIdSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.id;

export const currentChannelMessagesSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.messages || [];

export const currentChannelUsersSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.users || [];

export const currentChannelRecentInputsSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.recentInputs || [];

export const isJoinedCurrentChannelSelector = (state: RootState) => {
  const channel = state.chat.channels.entities[state.chat.currentChannel!];
  return channel?.userState && channel?.roomState;
};

export const isFirstMessageAltBgSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.isFirstMessageAltBg;

export const authStatusSelector = (state: RootState) =>
  state.chat.me.authStatus;

export const meIdSelector = (state: RootState) => state.chat.me.id;

export const meLoginSelector = (state: RootState) => state.chat.me.login;

export const accessTokenSelector = (state: RootState) =>
  state.chat.me.accessToken;

export const meSelector = (state: RootState) => ({
  id: state.chat.me.id,
  login: state.chat.me.login,
  picture: state.chat.me.picture,
  displayName:
    state.chat.me.displayName || state.chat.me.globalUserState?.displayName,
  color: state.chat.me.globalUserState?.color,
});

export const blockedUsersSelector = (state: RootState) =>
  state.chat.me.blockedUsers.data;

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
  blockedUsers: state.chat.me.blockedUsers.status,
});

export const fetchChannelStatusSelector = (state: RootState) => {
  const channel = state.chat.channels.entities[state.chat.currentChannel!];

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

export const fetchRecentMessagesStatusSelector = (state: RootState) =>
  Object.values(state.chat.channels.entities).map(channel => ({
    name: channel!.name,
    status: channel!.recentMessages.status,
  }));

export const isChannelReadySelector = (state: RootState) =>
  !!state.chat.channels.entities[state.chat.currentChannel!]?.ready;

export const isChannelResourcesLoadedSelector = (state: RootState) => {
  const channel = state.chat.channels.entities[state.chat.currentChannel!];
  if (!channel) return false;

  const { authStatus } = state.chat.me;
  const { options } = state.chat;

  const statuses = [
    authStatus === 'success' ? state.chat.me.blockedUsers.status : null,
    authStatus === 'success' ? state.chat.emotes.twitch.status : null,
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

import { useAuthContext } from '@app/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import {
  chatConnected,
  chatDisconnected,
  chatRegistered,
  clearChatReceived,
  clearMsgReceived,
  globalUserStateReceived,
  messageReceived,
  roomStateReceived,
  userStateReceived,
} from '@app/store/reducers/chat/chatReducer';
import {
  privateMessageReceived,
  userNoticeReceived,
  noticeReceived,
} from '@app/store/reducers/chat/chatThunks';
import createCustomNotice from '@app/store/reducers/chat/util/createCustomNotice';
import getIrcChannelName from '@app/store/reducers/chat/util/getIrcChannelName';
import {
  parseGlobalUserState,
  parseRoomState,
  parseUserState,
} from '@app/store/reducers/chat/util/parseIRC';
import toDaysMinutesSeconds from '@app/store/reducers/chat/util/toDaysMinutesSeconds';
import { StaticAuthProvider } from '@twurple/auth';
import {
  ChatClient,
  GlobalUserState,
  PrivateMessage,
  RoomState,
  UserNotice,
  UserState,
} from '@twurple/chat';
import { MessageTypes } from 'ircv3';
import { useEffect, useRef } from 'react';

export default function useTwurpleClient() {
  const dispatch = useAppDispatch();
  const { authState } = useAuthContext();
  const channelNames = useAppSelector(
    state => state.chat.channels.ids as string[],
  );
  const chatRef = useRef<ChatClient | null>(null);
  const channelNamesRef = useRef<string[]>([]);

  channelNamesRef.current = channelNames;

  useEffect(() => {
    const chat = new ChatClient({
      authProvider: new StaticAuthProvider(
        process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        authState?.token.accessToken ?? '',
      ),
    });

    chatRef.current = chat;

    chat.onConnect(() => {
      dispatch(chatConnected());
    });

    chat.onDisconnect((manually, reason) => {
      dispatch(chatDisconnected());
      console.warn(`Disconnected. ${reason}`);
    });

    chat.onRegister(() => {
      channelNamesRef.current.forEach(channel =>
        chat
          .join(channel)
          .catch(e =>
            dispatch(messageReceived(createCustomNotice(channel, e.message))),
          ),
      );
      dispatch(chatRegistered());
    });

    chat.onAuthenticationFailure((message, retryCount) => {
      // eslint-disable-next-line no-console
      console.warn(message, retryCount);
    });

    chat.onTypedMessage(GlobalUserState, msg => {
      dispatch(globalUserStateReceived(parseGlobalUserState(msg)));
    });

    chat.onTypedMessage(UserState, msg => {
      const userState = parseUserState(msg);
      const channelName = getIrcChannelName(msg);
      dispatch(userStateReceived({ channelName, userState }));
    });

    chat.onTypedMessage(RoomState, msg => {
      const roomState = parseRoomState(msg);
      const channelName = getIrcChannelName(msg);
      dispatch(roomStateReceived({ channelName, roomState }));
    });

    // ban
    chat.onBan((channelName, login) => {
      const messageBody = `${login} has been permanently banned.`;
      dispatch(clearChatReceived({ channelName, login }));
      dispatch(createCustomNotice(channelName, messageBody));
    });

    chat.onTimeout((channelName, login, duration) => {
      const durationText = toDaysMinutesSeconds(duration);
      const messageBody = `${login} has been timed out for ${durationText}.`;
      dispatch(clearChatReceived({ channelName, login }));
      dispatch(createCustomNotice(channelName, messageBody));
    });

    chat.onChatClear(channelName => {
      dispatch(clearChatReceived({ channelName }));
    });

    // ClearMsg
    chat.onMessageRemove((channelName, messageId) => {
      dispatch(clearMsgReceived({ channelName, messageId }));
    });

    // chat.onHost((channel, target, viewers) => {});
    // chat.onUnhost((channel) => {});

    // chat.onJoin(() => {});
    // chat.onJoinFailure(() => {});
    // chat.onPart(() => {});

    chat.onTypedMessage(PrivateMessage, msg => {
      dispatch(privateMessageReceived(msg));
    });

    chat.onTypedMessage(UserNotice, msg => {
      dispatch(userNoticeReceived(msg));
    });

    chat.onTypedMessage(MessageTypes.Commands.Notice, msg => {
      dispatch(noticeReceived(msg));
    });

    // Privmsg
    // chat.onHosted((channel, byChannel, auto, viewers) => {});
    // chat.onMessage((channel, user, message, msg) => {});
    // chat.onAction((channel, user, message, msg) => {});

    // RoomState
    // this.onSlow
    // this.onFollowersOnly

    // UserNotice
    // this.onSub
    // this.onResub
    // this.onSubGift
    // this.onCommunitySub
    // this.onPrimePaidUpgrade
    // this.onGiftPaidUpgrade
    // this.onStandardPayForward
    // this.onCommunityPayForward
    // this.onPrimeCommunityGift
    // this.onRaid
    // this.onRaidCancel
    // this.onRitual
    // this.onBitsBadgeUpgrade
    // this.onSubExtend
    // this.onRewardGift
    // this.onAnnouncement

    // Whisper
    // this.onWhisper

    // Notice
    // this.onEmoteOnly
    // this.onHostsRemaining
    // this.onR9k
    // this.onSubsOnly
    // this.onNoPermission
    // this.onMessageRatelimit
    // this.onMessageFailed

    chat.connect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  return chatRef;
}

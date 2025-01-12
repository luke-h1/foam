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
import { useEffect, useRef, useCallback } from 'react';

export default function useTwurpleClient() {
  const dispatch = useAppDispatch();
  const { authState } = useAuthContext();
  const channelNames = useAppSelector(
    state => state.chat.channels.ids as string[],
  );
  const chatRef = useRef<ChatClient | null>(null);
  const channelNamesRef = useRef<string[]>([]);

  channelNamesRef.current = channelNames;

  const handleConnect = useCallback(() => {
    dispatch(chatConnected());
  }, [dispatch]);

  const handleDisconnect = useCallback(
    (manually: boolean, reason: string) => {
      dispatch(chatDisconnected());
      console.warn(`Disconnected. ${reason}`);
    },
    [dispatch],
  );

  const handleRegister = useCallback(() => {
    channelNamesRef.current.forEach(channel =>
      chatRef.current
        ?.join(channel)
        .catch(e =>
          dispatch(messageReceived(createCustomNotice(channel, e.message))),
        ),
    );
    dispatch(chatRegistered());
  }, [dispatch]);

  const handleAuthenticationFailure = useCallback(
    (message: string, retryCount: number) => {
      console.warn(message, retryCount);
    },
    [],
  );

  const handleGlobalUserState = useCallback(
    (msg: GlobalUserState) => {
      dispatch(globalUserStateReceived(parseGlobalUserState(msg)));
    },
    [dispatch],
  );

  const handleUserState = useCallback(
    (msg: UserState) => {
      const userState = parseUserState(msg);
      const channelName = getIrcChannelName(msg);
      dispatch(userStateReceived({ channelName, userState }));
    },
    [dispatch],
  );

  const handleRoomState = useCallback(
    (msg: RoomState) => {
      const roomState = parseRoomState(msg);
      const channelName = getIrcChannelName(msg);
      dispatch(roomStateReceived({ channelName, roomState }));
    },
    [dispatch],
  );

  const handleBan = useCallback(
    (channelName: string, login: string) => {
      const messageBody = `${login} has been permanently banned.`;
      dispatch(clearChatReceived({ channelName, login }));
      dispatch(createCustomNotice(channelName, messageBody));
    },
    [dispatch],
  );

  const handleTimeout = useCallback(
    (channelName: string, login: string, duration: number) => {
      const durationText = toDaysMinutesSeconds(duration);
      const messageBody = `${login} has been timed out for ${durationText}.`;
      dispatch(clearChatReceived({ channelName, login }));
      dispatch(createCustomNotice(channelName, messageBody));
    },
    [dispatch],
  );

  const handleChatClear = useCallback(
    (channelName: string) => {
      dispatch(clearChatReceived({ channelName }));
    },
    [dispatch],
  );

  const handleMessageRemove = useCallback(
    (channelName: string, messageId: string) => {
      dispatch(clearMsgReceived({ channelName, messageId }));
    },
    [dispatch],
  );

  const handlePrivateMessage = useCallback(
    (msg: PrivateMessage) => {
      dispatch(privateMessageReceived(msg));
    },
    [dispatch],
  );

  const handleUserNotice = useCallback(
    (msg: UserNotice) => {
      dispatch(userNoticeReceived(msg));
    },
    [dispatch],
  );

  const handleNotice = useCallback(
    (msg: MessageTypes.Commands.Notice) => {
      dispatch(noticeReceived(msg));
    },
    [dispatch],
  );

  useEffect(() => {
    const chat = new ChatClient({
      authProvider: new StaticAuthProvider(
        process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        authState?.token.accessToken,
      ),
    });

    chatRef.current = chat;

    chat.onConnect(handleConnect);
    chat.onDisconnect(handleDisconnect);
    chat.onRegister(handleRegister);
    chat.onAuthenticationFailure(handleAuthenticationFailure);
    chat.onTypedMessage(GlobalUserState, handleGlobalUserState);
    chat.onTypedMessage(UserState, handleUserState);
    chat.onTypedMessage(RoomState, handleRoomState);
    chat.onBan(handleBan);
    chat.onTimeout(handleTimeout);
    chat.onChatClear(handleChatClear);
    chat.onMessageRemove(handleMessageRemove);
    chat.onTypedMessage(PrivateMessage, handlePrivateMessage);
    chat.onTypedMessage(UserNotice, handleUserNotice);
    chat.onTypedMessage(MessageTypes.Commands.Notice, handleNotice);

    (async () => {
      await chat.connect();
    })();

    return () => {};
  }, [
    authState?.token.accessToken,
    handleConnect,
    handleDisconnect,
    handleRegister,
    handleAuthenticationFailure,
    handleGlobalUserState,
    handleUserState,
    handleRoomState,
    handleBan,
    handleTimeout,
    handleChatClear,
    handleMessageRemove,
    handlePrivateMessage,
    handleUserNotice,
    handleNotice,
  ]);

  return chatRef;
}

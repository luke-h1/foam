import useAppNavigation from '@app/hooks/useAppNavigation';
import useFetchChatData from '@app/hooks/useFetchChatData';
import useTwurpleClient from '@app/hooks/useTwurpleClient';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import {
  messageReceived,
  channelAdded,
  channelRemoved,
} from '@app/store/reducers/chat/chatReducer';
import { messageSended } from '@app/store/reducers/chat/chatThunks';
import { AllEmotes } from '@app/store/reducers/chat/types/emote';
import createCustomNotice from '@app/store/reducers/chat/util/createCustomNotice';
import replaceEmojis from '@app/store/reducers/chat/util/replaceEmojis';
import { emotesSelector } from '@app/store/selectors/emote';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import ChatMessages from './ChatMessages/ChatMessages';

interface Props {
  login: string;
}

function V2Chat({ login }: Props) {
  const channel = useAppSelector(state => state.chat.currentChannel);
  const emotes = useAppSelector(emotesSelector);
  const dispatch = useAppDispatch();
  const chatRef = useTwurpleClient();
  const navigation = useAppNavigation();
  useFetchChatData();

  const textInputRef = useRef<TextInput>();
  const channelRef = useRef<string>();
  const emotesRef = useRef<AllEmotes | undefined>(undefined);
  const scrollViewRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');

  channelRef.current = channel;
  emotesRef.current = emotes;

  navigation.addListener('beforeRemove', () => {
    console.info('disconnecting...');
    chatRef.current?.part(login);
    dispatch(channelRemoved(login));
    console.info('disconnected');
  });

  const connectToChat = useCallback(() => {
    console.log('-----------------------------------------------------');
    console.log('attempting to join', login);
    console.log('-----------------------------------------------------');
    chatRef.current?.join(login as string).catch(e => {
      dispatch(messageReceived(createCustomNotice(login, e.message)));
    });
    dispatch(channelAdded(login as string));

    chatRef.current?.onJoin(e => {
      console.log('joined');
    });

    chatRef.current?.onAnyMessage(e => console.log(e));

    return () => {
      chatRef.current?.part(login as string);
      dispatch(channelRemoved(login as string));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login]);

  useEffect(() => {
    connectToChat();
  }, [connectToChat]);

  const sendMessage = useCallback(
    (channelName: string, message: string) => {
      if (!textInputRef.current || !chatRef.current || !message.trim()) {
        return;
      }

      setText('');

      const normalizedMessage = replaceEmojis(
        emotesRef.current?.emoji,
        message.trim(),
      );

      chatRef.current.say(channelName, normalizedMessage as string);
      dispatch(
        messageSended({
          channelName,
          message: normalizedMessage || '',
        }),
      );

      // Scroll to bottom after sending a message
      scrollViewRef.current?.scrollToEnd({ animated: true });
    },
    [chatRef, textInputRef, emotesRef, dispatch],
  );

  const handleSendMessage = useCallback(() => {
    if (!channelRef.current || !text) {
      return;
    }

    sendMessage(channelRef.current, text);
  }, [text, sendMessage]);

  const handleNameRightPress = useCallback(
    (name: string) => {
      if (!textInputRef.current) {
        return;
      }

      textInputRef.current.focus();
    },
    [textInputRef],
  );

  useEffect(() => {
    // Scroll to bottom when a new message is received
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [channel]);

  return (
    <View style={$container}>
      <ChatMessages onNameRightPress={handleNameRightPress} />
      {/* <ChatInput ref={textareaRef} sendMessage={sendMessage} />
      <ChatControls onChatClick={handleSendMessage} /> */}
    </View>
  );
}

export default memo(V2Chat);

const $container: ViewStyle = {
  flex: 1,
  justifyContent: 'flex-start',
  width: Dimensions.get('window').width,
};

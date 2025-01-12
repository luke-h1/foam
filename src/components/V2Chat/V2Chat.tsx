import useFetchChatData from '@app/hooks/useFetchChatData';
import useTwurpleClient from '@app/hooks/useTwurpleClient';
import { useAppDispatch, useAppSelector } from '@app/store/hooks';
import { messageSended } from '@app/store/reducers/chat/chatThunks';
import { AllEmotes } from '@app/store/reducers/chat/types/emote';
import replaceEmojis from '@app/store/reducers/chat/util/replaceEmojis';
import { emotesSelector } from '@app/store/selectors/emote';
import { useCallback, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

export default function V2Chat() {
  const channel = useAppSelector(state => state.chat.currentChannel);
  const emotes = useAppSelector(emotesSelector);
  const dispatch = useAppDispatch();
  const chatRef = useTwurpleClient();
  useFetchChatData();

  const textInputRef = useRef<TextInput>();
  const channelRef = useRef<string>();
  const emotesRef = useRef<AllEmotes | undefined>(undefined);
  const [text, setText] = useState('');

  channelRef.current = channel;
  emotesRef.current = emotes;

  const sendMessage = useCallback(
    (channelName: string, message: string) => {
      if (!textInputRef.current || !chatRef.current || !message.trim()) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // textInputRef.current.value = '';
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatRef, textInputRef, emotesRef],
  );

  const handleSendMessage = useCallback(() => {
    if (!channelRef.current || !text) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    sendMessage(channelRef.current, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInputRef, channelRef, sendMessage]);

  const handleNameRightPress = useCallback(
    (name: string) => {
      if (!textInputRef.current) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      textInputRef.current.value = `${textInputRef.current.value.trim()} @${name} `;
      textInputRef.current.focus();
    },
    [textInputRef],
  );

  return (
    <View>
      <ChatMessages onNameRightClick={handleNameRightClick} />
      <ChatInput ref={textareaRef} sendMessage={sendMessage} />
      <ChatControls onChatClick={handleSendMessage} />
    </View>
  );
}

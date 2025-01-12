import { useAppSelector } from '@app/store/hooks';
import { SUGGESTION_TYPES } from '@app/store/reducers/chat/config';
import { SendMessageFn } from '@app/store/reducers/chat/types';
import getEmotesByText from '@app/store/reducers/chat/util/getEmotesByText';
import getUsersByBeginningText from '@app/store/reducers/chat/util/getUserByBeginningText';
import replaceSuggestionText from '@app/store/reducers/chat/util/replaceSuggestionText';
import {
  currentChannelRecentInputsSelector,
  currentChannelUsersSelector,
} from '@app/store/selectors/chat';
import { emotesSelector } from '@app/store/selectors/emote';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  TextInputChangeEventData,
  NativeSyntheticEvent,
  TextInput,
} from 'react-native';
import useSuggestions from './useSuggestions';

type SuggestionType = ReturnType<typeof useSuggestions>; // Assuming useSuggestions is a hook for suggestion data.

interface UseChatReturn {
  suggestions: SuggestionType;
  handleEmoteClick: (name: string) => void;

  // React Native equivalent of handleChange (using TextInputChangeEventData)
  handleChange: (e: NativeSyntheticEvent<TextInputChangeEventData>) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleKeyUp: (e: NativeSyntheticEvent<any>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleKeyDown: (e: NativeSyntheticEvent<any>) => void; // Same as above, adjust based on usage.

  // React Native equivalent of mouse events:
  onPressIn: (index: number) => void;

  handleSuggestionPress: (index: number) => void;
}

export default function useChatInput(
  sendMessage: SendMessageFn,
  textInputRef: RefObject<TextInput>,
): UseChatReturn {
  const [recentInputsIndex, setRecentInputsIndex] = useState<number>(-1);
  const channel = useAppSelector(state => state.chat.currentChannel as string);
  const emotes = useAppSelector(emotesSelector);
  const users = useAppSelector(currentChannelUsersSelector);
  const recentInputs = useAppSelector(currentChannelRecentInputsSelector);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [value, setValue] = useState('');

  const handleSelectionChange = ({ nativeEvent: { selection } }) => {
    setSelection(selection);
  };
  const suggestions = useSuggestions();

  useEffect(() => {
    setRecentInputsIndex(-1);
  }, [recentInputs]);

  const getDeps = () => ({
    textInput: textInputRef.current,
    channel,
    emotes,
    users,
    recentInputs,
    recentInputsIndex,
    suggestions,
  });

  const deps = useRef({} as ReturnType<typeof getDeps>);

  deps.current = getDeps();

  const handleChange = useCallback(
    (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const { text } = e.nativeEvent;

      const { start } = selection;
      const spaceIndexBefore = value.lastIndexOf(' ', start - 1);
      const spaceIndexAfter = value.indexOf(' ', start);
      const wordStart = spaceIndexBefore === -1 ? 0 : spaceIndexBefore + 1;
      const wordEnd = spaceIndexAfter === -1 ? value.length : spaceIndexAfter;
      const word = value.substring(wordStart, wordEnd);

      const usersMatch = SUGGESTION_TYPES.users.regex.exec(word);

      /**
       * Search for a user
       */
      if (usersMatch) {
        const [, beginText] = usersMatch;

        const items = getUsersByBeginningText(
          beginText,
          deps.current.users,
          '', // need username here
          SUGGESTION_TYPES.users.limit,
        );

        deps.current.suggestions.set({
          type: 'users',
          isActive: true,
          items,
          activeIndex: 0,
          start: wordStart,
          end: wordEnd,
        });
        // eslint-disable-next-line no-useless-return
        return;
      }

      // emotes
      const emotesMatch = SUGGESTION_TYPES.emotes.regex.exec(word);

      if (emotesMatch && deps.current.emotes) {
        // eslint-disable-next-line no-shadow
        const [, text] = emotesMatch;

        const items = getEmotesByText(
          text,
          deps.current.emotes,
          SUGGESTION_TYPES.emotes.limit,
        );

        deps.current.suggestions.set({
          type: 'emotes',
          isActive: true,
          items,
          activeIndex: 0,
          start: wordStart,
          end: wordEnd,
        });
        // eslint-disable-next-line no-useless-return
        return;
      }

      if (deps.current.suggestions.state.isActive) {
        deps.current.suggestions.reset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKeyUp = useCallback((e: NativeSyntheticEvent<any>) => {
    console.log('keyup', e);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKeyDown = useCallback((e: NativeSyntheticEvent<any>) => {
    console.log('keydown', e);
  }, []);

  const handleSuggestionClick = useCallback(
    (activeIndex: number) => {
      console.log({ activeIndex });
      const d = deps.current;
      const newState = { ...d.suggestions.state, activeIndex };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // d.textInput?.value = replaceSuggestionText(d.textInput.text, newState);

      const newText = replaceSuggestionText(value, newState);

      d.textInput?.setNativeProps({
        text: newText,
      });

      setValue(newText);

      d.textInput?.focus();
      d.suggestions.reset();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps],
  );

  const handleEmoteClick = useCallback(
    (name: string) => {
      const d = deps.current;
      d.textInput?.setNativeProps({
        text: `${value.trim()} ${name}`,
      });

      // d.textInput?.value = `${d.textInput?.value.trim()} ${name} `;
    },
    [deps],
  );

  const handleSuggestionPress = useCallback(e => {}, []);
  const onPressIn = useCallback(e => {}, []);

  return {
    suggestions,
    handleChange,
    handleKeyUp,
    onPressIn,
    handleKeyDown,
    handleSuggestionPress,
    handleEmoteClick,
  };
}

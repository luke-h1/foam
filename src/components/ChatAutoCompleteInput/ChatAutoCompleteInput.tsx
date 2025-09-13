import { SanitisiedEmoteSet } from '@app/services';
import { ChatUser, useChatStore } from '@app/store';

import {
  useCallback,
  useMemo,
  forwardRef,
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  StyleProp,
  ViewStyle,
  TextInput,
  View,
  LayoutChangeEvent,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { InputProps } from '..';
import { Button } from '../Button';
import { FlashList } from '../FlashList';
import { Image } from '../Image';
import Input from '../Input/Input';
import { Typography } from '../Typography';

// Add this type for user suggestions
type SuggestionType = 'emote' | 'user';

export interface EmoteAutoCompleteProps
  extends Omit<InputProps, 'onChangeText' | 'isFocused'> {
  onEmoteSelect?: (emote: SanitisiedEmoteSet) => void;
  onChangeText?: (text: string) => void;
  suggestionContainerStyle?: StyleProp<ViewStyle>;
  maxSuggestions?: number;
  placeholder?: string;
  prioritizeChannelEmotes?: boolean;
  showSiteLabel?: boolean;
  value?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const getCurrentWordInfo = (text: string, cursorPosition: number) => {
  /**
   * Find word boundaries (space, start, or end of string)
   */
  let wordStart = cursorPosition;
  let wordEnd = cursorPosition;

  /**
   * Find start of current word
   */
  while (wordStart > 0 && text[wordStart - 1] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordStart--;
  }

  /**
   * Find end of current word
   */
  while (wordEnd < text.length && text[wordEnd] !== ' ') {
    // eslint-disable-next-line no-plusplus
    wordEnd++;
  }

  const currentWord = text.substring(wordStart, wordEnd);

  return {
    word: currentWord,
    start: wordStart,
    end: wordEnd,
  };
};

const getCurrentWordAndType = (text: string, cursorPosition: number) => {
  const wordInfo = getCurrentWordInfo(text, cursorPosition);
  const isUserMention = wordInfo.word.startsWith('@');

  return {
    ...wordInfo,
    type: isUserMention ? 'user' : ('emote' as SuggestionType),
    searchTerm: isUserMention ? wordInfo.word.slice(1) : wordInfo.word,
  };
};

// eslint-disable-next-line react/display-name
export const ChatAutoCompleteInput = forwardRef<
  TextInput,
  EmoteAutoCompleteProps
>(
  (
    {
      onEmoteSelect,
      onChangeText,
      suggestionContainerStyle,
      maxSuggestions = 50,
      placeholder = 'Search emotes...',
      prioritizeChannelEmotes = true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      showSiteLabel = true,
      value = '',
      ...textFieldProps
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_suggestionType, setSuggestionType] =
      useState<SuggestionType>('emote');
    const [currentWordInfo, setCurrentWordInfo] = useState({
      word: '',
      start: 0,
      end: 0,
      type: 'emote' as SuggestionType,
      searchTerm: '',
    });

    const {
      bttvChannelEmotes,
      bttvGlobalEmotes,
      emojis,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      status,
      ttvUsers,
      twitchGlobalEmotes,
    } = useChatStore();

    /**
     * ref to measure input position
     */
    const inputRef = useRef<View>(null);
    const [inputLayout, setInputLayout] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    const suggestionOpacity = useSharedValue(0);
    const suggestionScale = useSharedValue(0.55);
    const suggestionTranslateY = useSharedValue(-10);

    /**
     * Combine all emotes with prioritization
     */
    const allEmotes = useMemo(() => {
      const channelEmotes = [
        ...sevenTvChannelEmotes,
        ...twitchChannelEmotes,
        ...bttvChannelEmotes,
        ...ffzChannelEmotes,
      ];

      const globalEmotes = [
        ...sevenTvGlobalEmotes,
        ...twitchGlobalEmotes,
        ...bttvGlobalEmotes,
        ...ffzGlobalEmotes,
        ...emojis,
      ];

      /**
       * Create a map to avoid duplicates (channel emotes override global ones)
       */
      const emoteMap = new Map<string, SanitisiedEmoteSet>();

      /**
       * Add global emotes first
       */
      globalEmotes.forEach(emote => {
        emoteMap.set(emote.name.toLowerCase(), emote);
      });

      /**
       * Add channel emotes (these will override global ones with same name)
       */
      channelEmotes.forEach(emote => {
        emoteMap.set(emote.name.toLowerCase(), emote);
      });

      const uniqueEmotes = Array.from(emoteMap.values());

      if (prioritizeChannelEmotes) {
        /**
         * Sort channel emotes first, then by name
         */
        return uniqueEmotes.sort((a, b) => {
          const aIsChannel = channelEmotes.some(ce => ce.id === a.id);
          const bIsChannel = channelEmotes.some(ce => ce.id === b.id);

          if (aIsChannel && !bIsChannel) return -1;
          if (!aIsChannel && bIsChannel) return 1;

          return a.name.localeCompare(b.name);
        });
      }

      return uniqueEmotes.sort((a, b) => a.name.localeCompare(b.name));
    }, [
      sevenTvChannelEmotes,
      sevenTvGlobalEmotes,
      twitchChannelEmotes,
      twitchGlobalEmotes,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      emojis,
      prioritizeChannelEmotes,
    ]);

    /**
     * Update current word info when text or cursor position changes
     */
    useEffect(() => {
      const wordInfo = getCurrentWordAndType(value, cursorPosition);
      setCurrentWordInfo(wordInfo);
      setSuggestionType(wordInfo.type);
    }, [value, cursorPosition]);

    /**
     * Filter emotes based on current word
     */
    const filteredEmotes = useMemo(() => {
      if (!currentWordInfo.word.trim()) {
        return [];
      }

      const searchTerm = currentWordInfo.word.toLowerCase().trim();

      return allEmotes
        .filter(
          emote =>
            emote.name.toLowerCase().includes(searchTerm) ||
            (emote.original_name &&
              emote.original_name.toLowerCase().includes(searchTerm)),
        )
        .slice(0, maxSuggestions);
    }, [allEmotes, currentWordInfo.word, maxSuggestions]);

    const shouldShowSuggestions =
      isFocused && filteredEmotes.length > 0 && currentWordInfo.word.length > 0;

    useEffect(() => {
      if (shouldShowSuggestions) {
        setShowSuggestions(true);
        suggestionOpacity.value = withTiming(1, { duration: 50 });
        suggestionScale.value = withSpring(1, {
          damping: 20,
          stiffness: 300,
        });
        suggestionTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      } else {
        suggestionOpacity.value = withTiming(0, { duration: 150 });
        suggestionScale.value = withTiming(0.95, { duration: 150 });
        suggestionTranslateY.value = withTiming(-10, { duration: 150 }, () => {
          runOnJS(setShowSuggestions)(false);
        });
      }
    }, [
      shouldShowSuggestions,
      suggestionOpacity,
      suggestionScale,
      suggestionTranslateY,
    ]);

    const animatedSuggestionStyle = useAnimatedStyle(() => {
      const suggestionsHeight = 280;

      // Always show suggestions above input when keyboard is shown
      // This ensures suggestions are always visible and not covered by keyboard
      return {
        opacity: suggestionOpacity.value,
        transform: [
          { scale: suggestionScale.value },
          { translateY: suggestionTranslateY.value },
        ],
        position: 'absolute',
        left: 0,
        right: 0,
        width: inputLayout.width,
        height: suggestionsHeight,
        maxHeight: suggestionsHeight,
        // Always position above input
        bottom: inputLayout.height + 10,
        zIndex: 1000,
      };
    });

    const handleEmotePress = useCallback(
      (emote: SanitisiedEmoteSet) => {
        /**
         * Only replace the current word with the emote name
         */
        const beforeWord = value.substring(0, currentWordInfo.start);
        const afterWord = value.substring(currentWordInfo.end);
        const newText = beforeWord + emote.name + afterWord;
        const newCursorPosition = currentWordInfo.start + emote.name.length;

        onEmoteSelect?.(emote);
        onChangeText?.(newText);

        /**
         * Hide suggestions after the user has selected
         */
        setShowSuggestions(false);
        suggestionOpacity.value = withTiming(0, { duration: 50 });
        suggestionScale.value = withTiming(0.95, { duration: 50 });
        suggestionTranslateY.value = withTiming(-10, { duration: 50 });

        setTimeout(() => {
          setCursorPosition(newCursorPosition);
        }, 10);
      },
      [
        value,
        currentWordInfo,
        onEmoteSelect,
        onChangeText,
        suggestionOpacity,
        suggestionScale,
        suggestionTranslateY,
      ],
    );

    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    const handleSelectionChange = useCallback(
      (event: {
        nativeEvent: { selection: { start: number; end: number } };
      }) => {
        setCursorPosition(event.nativeEvent.selection.start);
      },
      [],
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    const renderEmoteItem = useCallback(
      ({ item, index }: { item: SanitisiedEmoteSet; index: number }) => (
        <AnimatedView
          entering={FadeInUp.delay(index * 20)
            .duration(300)
            .springify()}
          style={styles.animatedItem}
        >
          <Button
            style={styles.suggestionItem}
            onPress={() => handleEmotePress(item)}
          >
            <View style={styles.emoteContainer}>
              <AnimatedView
                entering={FadeIn.delay(index * 20 + 100).duration(200)}
              >
                <Image
                  source={item.url}
                  style={[
                    styles.emoteImage,
                    item.width && item.height
                      ? { aspectRatio: item.width / item.height }
                      : undefined,
                  ]}
                />
              </AnimatedView>
              <View style={styles.emoteTextContainer}>
                <Typography
                  style={styles.emoteName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Typography>
                <Typography
                  style={styles.emoteSite}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.site}
                </Typography>
              </View>
            </View>
          </Button>
        </AnimatedView>
      ),
      [handleEmotePress],
    );

    const handleOutsidePress = useCallback(() => {
      if (showSuggestions) {
        setShowSuggestions(false);
        suggestionOpacity.value = withTiming(0, { duration: 150 });
        suggestionScale.value = withTiming(0.95, { duration: 150 });
        suggestionTranslateY.value = withTiming(-10, { duration: 150 });
      }
    }, [
      showSuggestions,
      suggestionOpacity,
      suggestionScale,
      suggestionTranslateY,
    ]);

    const handleInputLayout = useCallback((event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setInputLayout({ x, y, width, height });
    }, []);

    const [showUserSuggestions, setShowUserSuggestions] = useState(false);

    useEffect(() => {
      const wordInfo = getCurrentWordInfo(value, cursorPosition);
      setCurrentWordInfo({
        ...wordInfo,
        type: 'emote' as SuggestionType,
        searchTerm: wordInfo.word,
      });

      // Check if we should show user suggestions
      const isUserMention = wordInfo.word.startsWith('@');
      setShowUserSuggestions(isUserMention && wordInfo.word.length > 1);
    }, [value, cursorPosition]);

    // Modify the existing filteredUsers to handle user mentions
    const filteredUsers = useMemo(() => {
      if (!showUserSuggestions || !currentWordInfo.word.trim()) {
        return [];
      }

      const searchTerm = currentWordInfo.word.slice(1).toLowerCase().trim();
      return ttvUsers.filter(user =>
        user.name.toLowerCase().slice(1).includes(searchTerm),
      );
    }, [ttvUsers, currentWordInfo.word, showUserSuggestions]);

    const handleUserSelect = useCallback(
      (user: ChatUser) => {
        const beforeWord = value.substring(0, currentWordInfo.start);
        const afterWord = value.substring(currentWordInfo.end);
        const newText = `${beforeWord + user.name} ${afterWord}`;
        const newCursorPosition = currentWordInfo.start + user.name.length + 1;

        onChangeText?.(newText);
        setShowUserSuggestions(false);

        setTimeout(() => {
          setCursorPosition(newCursorPosition);
        }, 10);
      },
      [value, currentWordInfo, onChangeText],
    );

    if (status !== 'fulfilled') {
      return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <Input
            ref={ref}
            {...textFieldProps}
            value={value}
            placeholder={
              status === 'loading' ? 'Loading emotes...' : placeholder
            }
            onChangeText={onChangeText}
            style={[styles.input, textFieldProps.style]}
            editable={false}
          />
        </KeyboardAvoidingView>
      );
    }

    return (
      <View style={styles.mainContainer}>
        {/* User Suggestions */}
        {showUserSuggestions && filteredUsers.length > 0 && (
          <View style={styles.userSuggestionsWrapper}>
            <View style={styles.userSuggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.userSuggestionScroll}
                keyboardShouldPersistTaps="handled"
              >
                {filteredUsers.map(user => (
                  <Button
                    key={user.userId}
                    style={styles.userSuggestionItem}
                    onPress={() => handleUserSelect(user)}
                  >
                    <Typography
                      style={[styles.userSuggestionText, { color: user.color }]}
                    >
                      {user.name}
                    </Typography>
                  </Button>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Input Section */}
        <KeyboardAvoidingView style={styles.inputWrapper} behavior="padding">
          <Button onPress={handleOutsidePress}>
            <View style={styles.container}>
              <View ref={inputRef} onLayout={handleInputLayout}>
                <Input
                  ref={ref}
                  {...textFieldProps}
                  value={value}
                  placeholder={placeholder}
                  onChangeText={handleTextChange}
                  onSelectionChange={handleSelectionChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={[styles.input, textFieldProps.style]}
                />
              </View>
            </View>
          </Button>

          {/* Emote suggestions */}
          {showSuggestions && !showUserSuggestions && (
            <AnimatedView
              style={[
                styles.suggestionsContainer,
                suggestionContainerStyle,
                animatedSuggestionStyle,
              ]}
              pointerEvents="box-none"
            >
              <FlashList
                style={{ height: 280 }}
                keyboardShouldPersistTaps="handled"
                data={filteredEmotes}
                keyExtractor={item => item.id}
                renderItem={renderEmoteItem}
                removeClippedSubviews
                showsVerticalScrollIndicator={false}
              />
            </AnimatedView>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  },
);

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  textFieldContainer: {
    flex: 1,
    minHeight: 0,
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.md,
    minHeight: 0,
    height: 42,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  suggestionsContainer: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.text,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  animatedItem: {},
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
    minHeight: 52,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.accent.accent,
    marginHorizontal: theme.spacing.md,
  },
  emoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  emoteImage: {
    width: 32,
    height: 32,
  },
  emoteTextContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  emoteName: {
    fontWeight: '500',
    flexShrink: 1,
  },
  emoteSite: {
    marginTop: 2,
    flexShrink: 1,
  },
  userSuggestionsWrapper: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  userSuggestionsContainer: {
    backgroundColor: theme.colors.accent.accent,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.accent,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userSuggestionScroll: {
    flexDirection: 'row',
  },
  userSuggestionItem: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.accent.accentHover,
  },
  userSuggestionText: {
    fontWeight: '500',
  },
  mainContainer: {
    width: '100%',
  },
}));

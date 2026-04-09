import { FlashListRef } from '@app/components/FlashList/FlashList';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { useTwitchWs } from '@app/hooks/useTwitchWs';
import { sevenTvService } from '@app/services/seventv-service';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import {
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  clearCache,
  updateSevenTvEmotes,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chatStore/channelLoad';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import { fetchAndCacheUserCosmetics } from '@app/store/chatStore/cosmetics';
import { useChannelEmoteData, useUserPaints } from '@app/store/chatStore/hooks';
import {
  addMessage,
  clearMessages,
  getMessageColor,
} from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { findBadges } from '@app/utils/chat/findBadges';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';
import { batch } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Platform, TextInput, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Text } from '../Text/Text';
import { ActionSheet } from './components/ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './components/BadgePreviewSheet/BadgePreviewSheet';
import { ChatDebugModal, TestMessageType } from './components/ChatDebugModal';
import { ChatInputSection, ReplyToData } from './components/ChatInputSection';
import { ChatList } from './components/ChatList';
import type { EmotePressData } from './components/ChatMessage/RichChatMessage';
import {
  RichChatMessage,
  BadgePressData,
  MessageActionData,
  UsernamePressData,
} from './components/ChatMessage/RichChatMessage';
import { ChatViewControls } from './components/ChatViewControls';
import { EmotePreviewSheet } from './components/EmotePreviewSheet/EmotePreviewSheet';
import {
  EmoteSheet,
  EmotePickerItem,
} from './components/EmoteSheet/EmoteSheet';
import { ResumeScroll } from './components/ResumeScroll';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
import { UserActionSheet } from './components/UserActionSheet';
import { useChatEmoteLoader } from './hooks/useChatEmoteLoader';
import { useChatLifecycle } from './hooks/useChatLifecycle';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
import { useChatSevenTvCallbacks } from './hooks/useChatSevenTvCallbacks';
import { useConnectionStatePolling } from './hooks/useConnectionStatePolling';
import { useEmoteReprocessing } from './hooks/useEmoteReprocessing';
import {
  createTestPrimeSubNotice,
  createTestTier1SubNotice,
  createTestTier2SubNotice,
  createTestTier3SubNotice,
  createTestSubNotice,
  createTestViewerMilestoneNotice,
} from './util/createTestUserNotices';
import {
  AnyChatMessageType,
  createUserStateFromTags,
  createBaseMessage,
  createUserNoticeMessage,
  createSystemMessage,
} from './util/messageHandlers';
import { reprocessMessages } from './util/reprocessMessages';
import {
  getPausedPendingMessageCount,
  getVisibleMessages,
} from './util/visibleMessages';

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const { user } = useAuthContext();
  const preferences = usePreferences();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const messages$ = chatStore$.messages;
  const rawMessages = useSelector(chatStore$.messages) as AnyChatMessageType[];
  const hasMessages = useSelector(() => chatStore$.messages.get().length > 0);
  const isMessagesEmpty = useSelector(
    () => chatStore$.messages.get().length === 0,
  );
  const channelEmoteData = useChannelEmoteData(channelId);
  const userPaints = useUserPaints();

  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const hasEverHadMessagesRef = useRef(false);
  const lastEmptyLogAtRef = useRef<number>(0);

  const listRef = useRef<FlashListRef<AnyChatMessageType> | null>(null);
  const emoteSheetRef = useRef<TrueSheet>(null);
  const settingsSheetRef = useRef<TrueSheet>(null);
  const chatInputRef = useRef<TextInput>(null);

  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyToData | null>(null);
  const [, setIsInputFocused] = useState(false);

  const [selectedBadge, setSelectedBadge] = useState<BadgePressData | null>(
    null,
  );
  const [selectedMessage, setSelectedMessage] =
    useState<MessageActionData<'usernotice'> | null>(null);
  const [selectedEmote, setSelectedEmote] = useState<EmotePressData | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<UsernamePressData | null>(
    null,
  );
  const [isDebugModalVisible, setIsDebugModalVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenUsers, setHiddenUsers] = useState<string[]>([]);
  const [hiddenPhrases, setHiddenPhrases] = useState<string[]>([]);
  const [highlightedUsers, setHighlightedUsers] = useState<string[]>([]);
  const [showOnlyMentions, setShowOnlyMentions] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseAnchorMessageId, setPauseAnchorMessageId] = useState<
    string | null
  >(null);

  const mentionColorCache = useRef<Map<string, string>>(new Map());
  const lightenedColorCache = useRef<Map<string, string>>(new Map());
  const fetchedCosmeticsUsers = useRef<Set<string>>(new Set());
  const chatStartTimeRef = useRef<number | null>(null);

  useTwitchWs();

  useEffect(() => {
    chatStartTimeRef.current = Date.now();
  }, [channelId]);

  useEffect(() => {
    setIsSearchVisible(false);
    setSearchQuery('');
    setHiddenUsers([]);
    setHiddenPhrases([]);
    setHighlightedUsers([]);
    setShowOnlyMentions(false);
    setIsPaused(false);
    setPauseAnchorMessageId(null);
    setSelectedUser(null);
  }, [channelId]);

  const canFetchCosmetics = useCallback((): boolean => {
    const chatStartTime = chatStartTimeRef.current;
    if (!chatStartTime) {
      return true;
    }

    const elapsedSeconds = (Date.now() - chatStartTime) / 1000;
    return elapsedSeconds <= 5;
  }, []);

  const fetchUserCosmetics = useCallback(
    async (twitchUserId: string) => {
      if (fetchedCosmeticsUsers.current.has(twitchUserId)) {
        return;
      }

      if (!canFetchCosmetics()) {
        const chatStartTime = chatStartTimeRef.current;
        const elapsedSeconds = chatStartTime
          ? (Date.now() - chatStartTime) / 1000
          : 0;
        logger.stvWs.debug(
          `Skipping cosmetic fetch for ${twitchUserId} - chat has been active for ${elapsedSeconds.toFixed(1)}s (limit: 5s)`,
        );
        return;
      }

      fetchedCosmeticsUsers.current.add(twitchUserId);

      const existingPaintId = chatStore$.userPaintIds[twitchUserId]?.peek();
      if (existingPaintId) {
        logger.stvWs.debug(
          `User ${twitchUserId} already has paint: ${existingPaintId}`,
        );
        return;
      }

      try {
        logger.stvWs.info(`Fetching cosmetics for user ${twitchUserId}...`);

        const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);

        if (sevenTvUserId) {
          logger.stvWs.info(
            `Got 7TV user ID ${sevenTvUserId} for Twitch user ${twitchUserId}`,
          );
          await fetchAndCacheUserCosmetics(sevenTvUserId);
          logger.stvWs.info(`Finished fetching cosmetics for ${twitchUserId}`);
        } else {
          logger.stvWs.debug(`No 7TV user ID found for ${twitchUserId}`);
        }
      } catch (error) {
        logger.stvWs.debug(
          `Failed to fetch cosmetics for ${twitchUserId}:`,
          error,
        );
      }
    },
    [canFetchCosmetics],
  );

  const {
    status: emoteLoadStatus,
    sevenTvEmoteSetId,
    refetch: refetchEmotes,
    cancel: cancelEmoteLoad,
  } = useChatEmoteLoader({
    channelId,
    enabled: true,
  });

  const {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    unreadCount,
    setUnreadCount,
    handleScroll,
    scrollToBottom,
    cleanup: cleanupScroll,
  } = useChatScroll({
    listRef,
    getMessagesLength: () => messages$.peek().length,
  });

  const visibleMessages = useMemo(
    () =>
      getVisibleMessages(rawMessages ?? [], {
        currentUsername: user?.login || user?.display_name,
        currentUserId: user?.id,
        hiddenUsers,
        hiddenPhrases,
        pauseAnchorMessageId,
        searchQuery,
        showOnlyMentions,
      }),
    [
      rawMessages,
      user?.login,
      user?.display_name,
      user?.id,
      hiddenUsers,
      hiddenPhrases,
      pauseAnchorMessageId,
      searchQuery,
      showOnlyMentions,
    ],
  );

  const pausedMessageCount = useMemo(() => {
    if (!isPaused) {
      return 0;
    }

    return getPausedPendingMessageCount(rawMessages ?? [], {
      currentUsername: user?.login || user?.display_name,
      currentUserId: user?.id,
      hiddenUsers,
      hiddenPhrases,
      pauseAnchorMessageId,
      searchQuery,
      showOnlyMentions,
    });
  }, [
    isPaused,
    rawMessages,
    user?.login,
    user?.display_name,
    user?.id,
    hiddenUsers,
    hiddenPhrases,
    pauseAnchorMessageId,
    searchQuery,
    showOnlyMentions,
  ]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() ||
        hiddenUsers.length ||
        hiddenPhrases.length ||
        highlightedUsers.length ||
        showOnlyMentions,
    );
  }, [
    searchQuery,
    hiddenUsers.length,
    hiddenPhrases.length,
    highlightedUsers.length,
    showOnlyMentions,
  ]);

  const {
    handleNewMessage,
    clearLocalMessages,
    cleanup: cleanupMessages,
    forceFlush,
  } = useChatMessages({
    isAtBottomRef,
    onUnreadIncrement: useCallback(
      (count: number) => setUnreadCount(prev => prev + count),
      [setUnreadCount],
    ),
  });

  const processMessageEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
      userId?: string,
    ) => {
      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) {
        handleNewMessage(baseMessage);
        return;
      }

      const hasEmotes =
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0;

      if (!hasEmotes) {
        handleNewMessage(baseMessage);
        return;
      }

      const personalEmotes = userId
        ? getUserPersonalEmotes(userId, channelId)
        : [];

      try {
        const replacedMessage = processEmotesWorklet({
          inputString: text.trimEnd(),
          userstate,
          sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
          sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
          sevenTvPersonalEmotes: personalEmotes,
          twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
          twitchChannelEmotes: emoteData.twitchChannelEmotes,
          ffzChannelEmotes: emoteData.ffzChannelEmotes,
          ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
          bttvChannelEmotes: emoteData.bttvChannelEmotes,
          bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
        });

        const replacedBadges = findBadges({
          userstate,
          chatterinoBadges: emoteData.chatterinoBadges,
          chatUsers: [],
          ffzChannelBadges: emoteData.ffzChannelBadges,
          ffzGlobalBadges: emoteData.ffzGlobalBadges,
          twitchChannelBadges: emoteData.twitchChannelBadges,
          twitchGlobalBadges: emoteData.twitchGlobalBadges,
        });

        handleNewMessage({
          ...baseMessage,
          message: replacedMessage,
          badges: replacedBadges,
        });
      } catch (error) {
        logger.chat.error('Error processing emotes:', error);
        handleNewMessage(baseMessage);
      }
    },
    [channelId, handleNewMessage],
  );

  const reprocessAllMessages = useCallback(() => {
    reprocessMessages(
      messages$.peek() as AnyChatMessageType[],
      processMessageEmotes,
    );
  }, [messages$, processMessageEmotes]);

  const onMessage = useCallback(
    (_channel: string, tags: Record<string, string>, text: string) => {
      const userstate = createUserStateFromTags(tags);
      const replyParentMessageId = tags['reply-parent-msg-id'];
      const replyParentDisplayName = tags['reply-parent-display-name'];

      const userId = tags['user-id'];
      if (userId) {
        void fetchUserCosmetics(userId);
        void fetchUserPersonalEmotes(userId, channelId);
      }

      let parentColor: string | undefined;
      if (replyParentDisplayName?.trim()) {
        if (replyParentMessageId) {
          parentColor =
            getMessageColor(replyParentMessageId) ||
            generateRandomTwitchColor(replyParentDisplayName);
        } else {
          parentColor = generateRandomTwitchColor(replyParentDisplayName);
        }
      }

      const baseMessage = createBaseMessage({ tags, channelName, text });
      const messageWithParentColor = { ...baseMessage, parentColor };

      processMessageEmotes(text, userstate, messageWithParentColor, userId);
    },
    [channelId, channelName, fetchUserCosmetics, processMessageEmotes],
  );

  const onUserNotice = useCallback(
    (_channel: string, tags: UserNoticeTags, text: string) => {
      const message = createUserNoticeMessage({ tags, channelName, text });
      handleNewMessage(message);
    },
    [channelName, handleNewMessage],
  );

  const onClearChat = useCallback(
    (
      _channel: string,
      tags: Record<string, string>,
      username?: string,
      banDuration?: number,
    ) => {
      const beforeCount = messages$.peek().length;
      logger.chat.warn('Twitch CLEARCHAT received', {
        channelId,
        channelName,
        username,
        banDuration,
        targetUserId: tags['target-user-id'],
        beforeCount,
      });

      clearLocalMessages();

      const isFullChatClear = !username;
      // eslint-disable-next-line no-nested-ternary
      const systemMessageText = isFullChatClear
        ? 'Chat was cleared by a moderator'
        : banDuration != null
          ? `${username} was banned for ${banDuration}.`
          : `Chat history for ${username} was cleared by a mod.`;

      const systemMessage = createSystemMessage(channelName, systemMessageText);

      batch(() => {
        clearMessages();
        addMessage(systemMessage as ChatMessageType<never>);
      });
      setTimeout(() => {
        void listRef.current?.scrollToEnd({ animated: false });
      }, 0);
    },
    [clearLocalMessages, channelId, channelName, messages$],
  );

  useEffect(() => {
    if (hasMessages) {
      hasEverHadMessagesRef.current = true;
    }
  }, [hasMessages]);

  useEffect(() => {
    if (!hasEverHadMessagesRef.current) return;
    if (!isMessagesEmpty) return;

    const now = Date.now();
    if (now - lastEmptyLogAtRef.current < 2000) return;
    lastEmptyLogAtRef.current = now;

    logger.chat.warn('Chat messages became empty', {
      channelId,
      channelName,
    });
  }, [isMessagesEmpty, channelId, channelName, messages$]);

  const onJoin = useCallback(() => {
    logger.chat.info('Joined channel:', channelName);
    const systemMessage = createSystemMessage(
      channelName,
      `Connected to ${channelName}'s room`,
    );
    addMessage(systemMessage as ChatMessageType<never>);
  }, [channelName]);

  const onPart = useCallback(() => {
    logger.chat.info('Parted from channel:', channelName);
    clearMessages();
    clearLocalMessages();
  }, [channelName, clearLocalMessages]);

  const {
    isConnected: isChatConnected,
    partChannel,
    joinChannel,
    sendMessage,
    getUserState,
  } = useTwitchChat({
    channel: channelName,
    onMessage,
    onUserNotice,
    onClearChat,
    onJoin,
    onPart,
  });

  const { currentEmoteSetIdRef } = useChatLifecycle({
    navigation,
    channelId,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
    fetchedCosmeticsUsersRef: fetchedCosmeticsUsers,
    processedMessageIdsRef,
  });

  const connected = useConnectionStatePolling(isChatConnected);

  useEffect(() => {
    const fetchCurrentUserCosmetics = async () => {
      if (!user?.id) return;

      try {
        const sevenTvUserId = await sevenTvService.get7tvUserId(user.id);

        if (sevenTvUserId) {
          await fetchAndCacheUserCosmetics(sevenTvUserId);
          logger.stvWs.info(
            `Fetched cosmetics for current user: ${user.display_name}`,
          );
        }
      } catch (error) {
        logger.stvWs.warn('Failed to fetch current user cosmetics:', error);
      }
    };

    void fetchCurrentUserCosmetics();
  }, [user?.id, user?.display_name]);

  const sevenTvCallbacks = useChatSevenTvCallbacks({
    channelId,
    sevenTvEmoteSetId,
    canFetchCosmetics,
    fetchAndCacheUserCosmetics,
    updateSevenTvEmotes,
  });

  const { subscribeToChannel, unsubscribeFromChannel, isConnected } =
    useSeventvWs({
      ...sevenTvCallbacks,
      onEvent: eventType => logger.stvWs.debug(`SevenTV event: ${eventType}`),
    });

  const wsConnected = useConnectionStatePolling(isConnected);

  useEffect(() => {
    if (!wsConnected || !channelId) return;

    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (!emoteSetId) {
      logger.stvWs.info(
        `No SevenTV emote set ID found for channel: ${channelId}`,
      );
      return;
    }

    if (
      currentEmoteSetIdRef.current &&
      currentEmoteSetIdRef.current !== emoteSetId
    ) {
      unsubscribeFromChannel();
    }

    if (currentEmoteSetIdRef.current !== emoteSetId) {
      currentEmoteSetIdRef.current = emoteSetId;
      subscribeToChannel(emoteSetId);
    }

    return () => {
      unsubscribeFromChannel();
      currentEmoteSetIdRef.current = null;
    };
  }, [
    channelId,
    subscribeToChannel,
    unsubscribeFromChannel,
    wsConnected,
    currentEmoteSetIdRef,
  ]);

  useEffect(() => {
    if (!wsConnected || !channelId || emoteLoadStatus !== 'success') return;

    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (emoteSetId && currentEmoteSetIdRef.current !== emoteSetId) {
      currentEmoteSetIdRef.current = emoteSetId;
      subscribeToChannel(emoteSetId);
    }
  }, [
    wsConnected,
    channelId,
    emoteLoadStatus,
    subscribeToChannel,
    currentEmoteSetIdRef,
  ]);

  useEmoteReprocessing({
    channelId,
    channelEmoteData,
    messages$,
    emoteLoadStatus,
    processedMessageIdsRef,
  });

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !isChatConnected()) return;

    const messageText = replyTo
      ? `@${replyTo.username} ${messageInput}`
      : messageInput;
    const currentUserState = getUserState();
    const badgeData = parseBadges(
      (currentUserState.badges as unknown as string) || '',
    );

    const optimisticUserstate = {
      ...currentUserState,
      'display-name':
        user?.display_name || currentUserState['display-name'] || '',
      login: user?.login || currentUserState.login || '',
      username:
        user?.display_name ||
        user?.login ||
        currentUserState['display-name'] ||
        '',
      'user-id': user?.id || currentUserState['user-id'] || '',
      'badges-raw': badgeData['badges-raw'],
      badges: badgeData.badges,
      color:
        currentUserState.color ||
        (user?.login ? generateRandomTwitchColor(user.login) : undefined),
      'reply-parent-msg-id': replyTo?.messageId || '',
      'reply-parent-msg-body': replyTo?.message || '',
      'reply-parent-display-name': replyTo?.username || '',
      'reply-parent-user-login': replyTo?.replyParentUserLogin || '',
    };

    const emoteData = getCurrentEmoteData(channelId);
    const senderName = user?.display_name || user?.login || '';

    const userBadges = emoteData
      ? findBadges({
          userstate: optimisticUserstate,
          chatterinoBadges: emoteData.chatterinoBadges,
          chatUsers: [],
          ffzChannelBadges: emoteData.ffzChannelBadges,
          ffzGlobalBadges: emoteData.ffzGlobalBadges,
          twitchChannelBadges: emoteData.twitchChannelBadges,
          twitchGlobalBadges: emoteData.twitchGlobalBadges,
        })
      : [];

    const optimisticMessage: AnyChatMessageType = {
      id: `${Date.now()}_optimistic`,
      userstate: optimisticUserstate,
      message: [{ type: 'text', content: messageText.trimEnd() }],
      badges: userBadges,
      channel: channelName,
      message_id: `${Date.now()}`,
      message_nonce: `${Date.now()}_nonce`,
      sender: senderName,
      parentDisplayName: replyTo?.username || '',
      replyDisplayName: replyTo?.replyParentUserLogin || '',
      replyBody: replyTo?.message || '',
      parentColor: replyTo?.color,
    };

    processMessageEmotes(messageText, optimisticUserstate, optimisticMessage);

    if (replyTo) {
      try {
        sendMessage(
          channelName,
          messageText,
          replyTo.messageId,
          replyTo.username,
          replyTo.message,
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, messageText);
    }

    setMessageInput('');
    setReplyTo(null);
  }, [
    channelName,
    channelId,
    messageInput,
    replyTo,
    sendMessage,
    isChatConnected,
    user,
    getUserState,
    processMessageEmotes,
  ]);

  const handleReply = useCallback(
    (message: ChatMessageType<'usernotice'>) => {
      const messageText = replaceEmotesWithText(message.message);
      const parentMessage = messages$
        .peek()
        .find(m => m?.message_id === message.message_id);

      const twitchUserId = message.userstate['user-id'];
      if (twitchUserId) {
        void fetchUserCosmetics(twitchUserId);
      }

      setReplyTo({
        messageId: message.message_id,
        username: message.sender,
        message: messageText,
        replyParentUserLogin: message.userstate.username || '',
        parentMessage: replaceEmotesWithText(
          parentMessage?.message as ParsedPart[],
        ),
        color: message.userstate.color,
        userId: twitchUserId || undefined,
      });
    },
    [fetchUserCosmetics, messages$],
  );

  const handleEmoteSelect = useCallback((item: EmotePickerItem) => {
    const emoteName = typeof item === 'string' ? item : item.name;
    setMessageInput(
      prev => `${prev}${prev.length > 0 ? ' ' : ''}${emoteName} `,
    );
    void emoteSheetRef.current?.dismiss();
  }, []);

  const handleOpenEmoteSheet = useCallback(() => {
    void emoteSheetRef.current?.present();
  }, []);

  const handleOpenSettingsSheet = useCallback(() => {
    void settingsSheetRef.current?.present();
  }, []);

  const appendMentionToComposer = useCallback((username: string) => {
    setMessageInput(prev => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `@${username} `;
      }

      return `${prev}${prev.endsWith(' ') ? '' : ' '}@${username} `;
    });
    chatInputRef.current?.focus();
  }, []);

  const hideUserFromView = useCallback((username: string | undefined) => {
    if (!username) {
      return;
    }

    const normalised = username.trim().toLowerCase();
    setHiddenUsers(prev =>
      prev.includes(normalised) ? prev : [...prev, normalised].slice(-50),
    );
  }, []);

  const toggleHighlightedUser = useCallback((username: string | undefined) => {
    if (!username) {
      return;
    }

    const normalised = username.trim().toLowerCase();
    setHighlightedUsers(prev =>
      prev.includes(normalised)
        ? prev.filter(entry => entry !== normalised)
        : [...prev, normalised].slice(-50),
    );
  }, []);

  const hidePhraseFromView = useCallback((phrase: string | undefined) => {
    if (!phrase?.trim()) {
      return;
    }

    const normalised = phrase.trim().toLowerCase();
    setHiddenPhrases(prev =>
      prev.includes(normalised) ? prev : [...prev, normalised].slice(-50),
    );
  }, []);

  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      setPauseAnchorMessageId(null);
      forceFlush();
      scrollToBottom();
      return;
    }

    const lastVisibleMessage = visibleMessages[visibleMessages.length - 1];
    setPauseAnchorMessageId(lastVisibleMessage?.message_id ?? null);
    setIsPaused(true);
  }, [forceFlush, isPaused, scrollToBottom, visibleMessages]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setHiddenUsers([]);
    setHiddenPhrases([]);
    setHighlightedUsers([]);
    setShowOnlyMentions(false);
  }, []);

  const handleBadgeLongPress = useCallback((badge: BadgePressData) => {
    setSelectedBadge(badge);
  }, []);

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      setSelectedMessage(data);
    },
    [],
  );

  const handleEmotePress = useCallback((emote: EmotePressData) => {
    setSelectedEmote(emote);
  }, []);

  const handleUsernamePress = useCallback((usernameData: UsernamePressData) => {
    setSelectedUser(usernameData);
  }, []);

  const handleActionSheetReply = useCallback(() => {
    if (!selectedMessage) return;
    handleReply(selectedMessage.messageData);
    setSelectedMessage(null);
  }, [selectedMessage, handleReply]);

  const handleActionSheetCopy = useCallback(() => {
    if (!selectedMessage) return;
    const messageText = replaceEmotesWithText(selectedMessage.message);
    void Clipboard.setStringAsync(messageText).then(() =>
      toast.success('Copied to clipboard'),
    );
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleActionSheetHideUser = useCallback(() => {
    hideUserFromView(selectedMessage?.username);
    setSelectedMessage(null);
  }, [hideUserFromView, selectedMessage]);

  const handleActionSheetHighlightUser = useCallback(() => {
    toggleHighlightedUser(selectedMessage?.username);
    setSelectedMessage(null);
  }, [selectedMessage, toggleHighlightedUser]);

  const handleActionSheetHidePhrase = useCallback(() => {
    if (!selectedMessage) {
      return;
    }

    hidePhraseFromView(replaceEmotesWithText(selectedMessage.message));
    setSelectedMessage(null);
  }, [hidePhraseFromView, selectedMessage]);

  const handleMentionSelectedUser = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    appendMentionToComposer(selectedUser.username);
    setSelectedUser(null);
  }, [appendMentionToComposer, selectedUser]);

  const handleCopySelectedUsername = useCallback(() => {
    if (!selectedUser?.username) {
      return;
    }

    void Clipboard.setStringAsync(selectedUser.username).then(() =>
      toast.success('Copied username'),
    );
    setSelectedUser(null);
  }, [selectedUser]);

  const handleHideSelectedUser = useCallback(() => {
    hideUserFromView(selectedUser?.username);
    setSelectedUser(null);
  }, [hideUserFromView, selectedUser]);

  const handleHighlightSelectedUser = useCallback(() => {
    toggleHighlightedUser(selectedUser?.username);
    setSelectedUser(null);
  }, [selectedUser, toggleHighlightedUser]);

  const getMentionColor = useCallback(
    (username: string): string => {
      const lowerUsername = username.toLowerCase();

      const cached = mentionColorCache.current.get(lowerUsername);
      if (cached) return cached;

      const currentMessages = messages$.peek();
      const mentionedUserMessage = currentMessages.find(msg => {
        const msgUsername = msg?.userstate.username?.toLowerCase();
        const msgLogin = msg?.userstate.login?.toLowerCase();
        const msgSender = msg?.sender?.toLowerCase();
        return (
          msgUsername === lowerUsername ||
          msgLogin === lowerUsername ||
          msgSender === lowerUsername
        );
      });

      const color =
        mentionedUserMessage?.userstate.color ||
        generateRandomTwitchColor(username);

      mentionColorCache.current.set(lowerUsername, color);

      return color;
    },
    [messages$],
  );

  const parseTextForEmotes = useCallback(
    (text: string): ParsedPart[] => {
      if (!text || !text.trim()) return [];

      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) return [{ type: 'text', content: text }];

      const hasEmotes =
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0;

      if (!hasEmotes) return [{ type: 'text', content: text }];

      return processEmotesWorklet({
        inputString: text.trimEnd(),
        userstate: null,
        sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
        sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
        twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
        twitchChannelEmotes: emoteData.twitchChannelEmotes,
        ffzChannelEmotes: emoteData.ffzChannelEmotes,
        ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
        bttvChannelEmotes: emoteData.bttvChannelEmotes,
        bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
      });
    },
    [channelId],
  );

  const handleTestMessage = useCallback(
    (type: TestMessageType) => {
      const testMessages: Record<TestMessageType, () => AnyChatMessageType> = {
        'Prime Sub': () => createTestPrimeSubNotice(1),
        'Tier 1 Sub': () => createTestTier1SubNotice(1),
        'Tier 2 Sub': () => createTestTier2SubNotice(1),
        'Tier 3 Sub': () => createTestTier3SubNotice(1),
        'Default Sub': createTestSubNotice,
        'Viewer Milestone': createTestViewerMilestoneNotice,
      };

      const testMessage = testMessages[type]();
      handleNewMessage({ ...testMessage, channel: channelName });
    },
    [channelName, handleNewMessage],
  );

  const handleClearChatCache = useCallback(() => {
    try {
      clearCache(channelId);
      logger.chat.info('Chat cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear chat cache:', error);
    }
  }, [channelId]);

  const handleClearImageCache = useCallback(async () => {
    try {
      await clearImageCache(channelId);
      logger.chat.info('Image cache cleared successfully');
    } catch (error) {
      logger.chat.error('Failed to clear image cache:', error);
    }
  }, [channelId]);

  const userPaintsRef = useRef(userPaints);
  userPaintsRef.current = userPaints;

  const getLightenedColor = useCallback(
    (color: string | undefined): string | undefined => {
      if (!color) return undefined;
      const cached = lightenedColorCache.current.get(color);
      if (cached) return cached;
      const lightened = lightenColor(color);
      lightenedColorCache.current.set(color, lightened);
      if (lightenedColorCache.current.size > 500) {
        const firstKey = lightenedColorCache.current.keys().next().value as
          | string
          | undefined;
        if (firstKey) lightenedColorCache.current.delete(firstKey);
      }
      return lightened;
    },
    [],
  );

  const getLightenedColorRef = useRef(getLightenedColor);
  getLightenedColorRef.current = getLightenedColor;
  const handleBadgeLongPressRef = useRef(handleBadgeLongPress);
  handleBadgeLongPressRef.current = handleBadgeLongPress;
  const handleMessageLongPressRef = useRef(handleMessageLongPress);
  handleMessageLongPressRef.current = handleMessageLongPress;
  const handleEmotePressRef = useRef(handleEmotePress);
  handleEmotePressRef.current = handleEmotePress;
  const getMentionColorRef = useRef(getMentionColor);
  getMentionColorRef.current = getMentionColor;
  const parseTextForEmotesRef = useRef(parseTextForEmotes);
  parseTextForEmotesRef.current = parseTextForEmotes;

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item: msg }: { item: AnyChatMessageType }) => (
      <RichChatMessage
        id={msg.id}
        channel={msg.channel}
        message={msg.message}
        userstate={msg.userstate}
        badges={msg.badges}
        message_id={msg.message_id}
        message_nonce={msg.message_nonce}
        sender={msg.sender}
        style={styles.messageContainer}
        parentDisplayName={msg.parentDisplayName}
        parentColor={msg.parentColor}
        replyDisplayName={msg.replyDisplayName}
        replyBody={msg.replyBody}
        onBadgePress={handleBadgeLongPressRef.current}
        onMessageLongPress={handleMessageLongPressRef.current}
        onEmotePress={handleEmotePressRef.current}
        onUsernamePress={handleUsernamePress}
        getMentionColor={getMentionColorRef.current}
        parseTextForEmotes={parseTextForEmotesRef.current}
        userPaints={userPaintsRef.current}
        isChannelPointRedemption={msg.isChannelPointRedemption}
        isTwitchSystemNotice={msg.isTwitchSystemNotice}
        currentUsername={
          preferences.highlightOwnMentions
            ? (user?.login ?? user?.display_name)
            : undefined
        }
        density={preferences.chatDensity}
        showTimestamp={preferences.chatTimestamps}
        highlightedUsers={highlightedUsers}
        showInlineReplyContext={preferences.showInlineReplyContext}
        // @ts-expect-error - notice_tags union type not narrowing correctly
        notice_tags={
          'notice_tags' in msg && msg.notice_tags ? msg.notice_tags : undefined
        }
      />
    ),
    [
      handleUsernamePress,
      user?.login,
      user?.display_name,
      preferences.chatDensity,
      preferences.highlightOwnMentions,
      preferences.chatTimestamps,
      preferences.showInlineReplyContext,
      highlightedUsers,
    ],
  );

  const keyExtractor = useCallback(
    (item: AnyChatMessageType) => `${item.message_id}_${item.message_nonce}`,
    [],
  );

  const getItemType = useCallback((item: AnyChatMessageType) => {
    return item.isSpecialNotice ? 'notice' : 'regular';
  }, []);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatContainer}>
          {!connected && !hasMessages && (
            <View style={styles.connectingContainer}>
              <Text style={styles.connectingText}>
                Connecting to {channelName}&apos;s chat...
              </Text>
            </View>
          )}

          <ChatViewControls
            hasActiveFilters={hasActiveFilters}
            isPaused={isPaused}
            onChangeSearch={setSearchQuery}
            onClearFilters={handleClearFilters}
            onTogglePause={handleTogglePause}
            onToggleSearch={() => setIsSearchVisible(prev => !prev)}
            onToggleShowOnlyMentions={() => setShowOnlyMentions(prev => !prev)}
            searchQuery={searchQuery}
            showOnlyMentions={showOnlyMentions}
            showSearch={isSearchVisible}
          />

          {visibleMessages.length === 0 && rawMessages.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                No chat messages match the current view
              </Text>
              <Text style={styles.emptyStateBody}>
                Clear filters or jump back to the latest messages.
              </Text>
            </View>
          ) : null}

          <ChatList
            data={visibleMessages.filter(
              (message): message is AnyChatMessageType => message != null,
            )}
            listRef={listRef}
            isAtBottomRef={isAtBottomRef}
            handleScroll={handleScroll}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            contentContainerStyle={styles.listContent}
          />

          {preferences.showUnreadJumpPill &&
            (!isAtBottom || isPaused) &&
            !isScrollingToBottom && (
              <ResumeScroll
                unreadCount={isPaused ? pausedMessageCount : unreadCount}
                onScrollToBottom={() => {
                  if (isPaused) {
                    setIsPaused(false);
                    setPauseAnchorMessageId(null);
                  }
                  forceFlush();
                  scrollToBottom();
                }}
              />
            )}
        </View>

        <ChatInputSection
          messageInput={messageInput}
          onChangeText={setMessageInput}
          onEmoteSelect={emote => {
            setMessageInput(
              prev => `${prev}${prev.length > 0 ? ' ' : ''}${emote.name} `,
            );
          }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onSubmit={handleSendMessage}
          onOpenEmoteSheet={handleOpenEmoteSheet}
          onOpenSettingsSheet={handleOpenSettingsSheet}
          onOpenDebugModal={() => setIsDebugModalVisible(true)}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          isConnected={connected}
          inputRef={chatInputRef}
        />

        {connected && (
          <EmoteSheet ref={emoteSheetRef} onEmoteSelect={handleEmoteSelect} />
        )}

        <SettingsSheet
          ref={settingsSheetRef}
          chatDensity={preferences.chatDensity}
          highlightOwnMentions={preferences.highlightOwnMentions}
          onRefetchEmotes={() => {
            void refetchEmotes().then(() => {
              reprocessAllMessages();
            });
          }}
          onReconnect={() => {
            partChannel(channelName);
            setTimeout(() => {
              joinChannel(channelName);
            }, 1000);
          }}
          onToggleChatDensity={() =>
            preferences.update({
              chatDensity:
                preferences.chatDensity === 'compact'
                  ? 'comfortable'
                  : 'compact',
            })
          }
          onToggleHighlightOwnMentions={value =>
            preferences.update({ highlightOwnMentions: value })
          }
          onToggleInlineReplyContext={value =>
            preferences.update({ showInlineReplyContext: value })
          }
          onToggleShowTimestamps={value =>
            preferences.update({ chatTimestamps: value })
          }
          onToggleShowUnreadJumpPill={value =>
            preferences.update({ showUnreadJumpPill: value })
          }
          showInlineReplyContext={preferences.showInlineReplyContext}
          showTimestamps={preferences.chatTimestamps}
          showUnreadJumpPill={preferences.showUnreadJumpPill}
        />

        <ChatDebugModal
          visible={isDebugModalVisible}
          onClose={() => setIsDebugModalVisible(false)}
          onTestMessage={handleTestMessage}
          onClearChatCache={handleClearChatCache}
          onClearImageCache={() => void handleClearImageCache()}
        />

        {selectedBadge && (
          <BadgePreviewSheet
            visible={Boolean(selectedBadge)}
            onClose={() => setSelectedBadge(null)}
            selectedBadge={selectedBadge}
          />
        )}

        {selectedEmote && (
          <EmotePreviewSheet
            visible={Boolean(selectedEmote)}
            onClose={() => setSelectedEmote(null)}
            selectedEmote={selectedEmote}
          />
        )}

        {selectedMessage && (
          <ActionSheet
            visible={Boolean(selectedMessage)}
            onClose={() => setSelectedMessage(null)}
            message={selectedMessage.message}
            username={selectedMessage.username}
            handleReply={handleActionSheetReply}
            handleCopy={handleActionSheetCopy}
            handleHidePhrase={handleActionSheetHidePhrase}
            handleHideUser={handleActionSheetHideUser}
            handleHighlightUser={handleActionSheetHighlightUser}
            isUserHighlighted={Boolean(
              selectedMessage.username &&
                highlightedUsers.includes(
                  selectedMessage.username.toLowerCase(),
                ),
            )}
          />
        )}

        {selectedUser && (
          <UserActionSheet
            visible={Boolean(selectedUser)}
            onClose={() => setSelectedUser(null)}
            username={selectedUser.username}
            login={selectedUser.login}
            onMentionUser={handleMentionSelectedUser}
            onCopyUsername={handleCopySelectedUsername}
            onHideUser={handleHideSelectedUser}
            onHighlightUser={handleHighlightSelectedUser}
            isHidden={hiddenUsers.includes(selectedUser.username.toLowerCase())}
            isHighlighted={highlightedUsers.includes(
              selectedUser.username.toLowerCase(),
            )}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
});

Chat.displayName = 'Chat';

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  connectingContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  connectingText: {
    color: theme.colors.gray.accent,
    fontSize: theme.font.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    marginHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  emptyStateBody: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.xs,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.font.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  messageContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    width: '100%',
  },
  wrapper: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
});

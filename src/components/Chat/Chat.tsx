import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { useTwitchWs } from '@app/hooks/useTwitchWs';
import { sevenTvService } from '@app/services/seventv-service';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import {
  ChatMessageType,
  chatStore$,
  useChannelEmoteData,
  addMessage,
  clearMessages,
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  clearCache,
  updateSevenTvEmotes,
  getMessageColor,
  useUserPaints,
  fetchAndCacheUserCosmetics,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chatStore';
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSelector } from '@legendapp/state/react';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as Clipboard from 'expo-clipboard';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Platform, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';

import { Text } from '../Text/Text';
import { ActionSheet } from './components/ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './components/BadgePreviewSheet/BadgePreviewSheet';
import { ChatDebugModal, TestMessageType } from './components/ChatDebugModal';
import { ChatInputSection, ReplyToData } from './components/ChatInputSection';
import { ChatMessage } from './components/ChatMessage/ChatMessage';
import {
  RichChatMessage,
  EmotePressData,
  BadgePressData,
  MessageActionData,
} from './components/ChatMessage/RichChatMessage';
import { EmotePreviewSheet } from './components/EmotePreviewSheet/EmotePreviewSheet';
import {
  EmoteSheet,
  EmotePickerItem,
} from './components/EmoteSheet/EmoteSheet';
import { ResumeScroll } from './components/ResumeScroll';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
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

interface ChatProps {
  channelId: string;
  channelName: string;
}

export const Chat = memo(({ channelName, channelId }: ChatProps) => {
  const { user } = useAuthContext();
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const messages$ = chatStore$.messages;
  const messages = useSelector(messages$);
  const channelEmoteData = useChannelEmoteData(channelId);
  const userPaints = useUserPaints();

  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  const listRef = useRef<FlashListRef<AnyChatMessageType> | null>(null);
  const emoteSheetRef = useRef<TrueSheet>(null);
  const settingsSheetRef = useRef<TrueSheet>(null);
  const debugModalRef = useRef<BottomSheetModal>(null);
  const chatInputRef = useRef<TextInput>(null);

  const emotePreviewSheetRef = useRef<BottomSheetModal>(null);
  const badgePreviewSheetRef = useRef<BottomSheetModal>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);

  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyToData | null>(null);
  const [, setIsInputFocused] = useState(false);

  const [selectedEmote, setSelectedEmote] = useState<EmotePressData | null>(
    null,
  );
  const [selectedBadge, setSelectedBadge] = useState<BadgePressData | null>(
    null,
  );
  const [selectedMessage, setSelectedMessage] =
    useState<MessageActionData<'usernotice'> | null>(null);

  const mentionColorCache = useRef<Map<string, string>>(new Map());
  const lightenedColorCache = useRef<Map<string, string>>(new Map());
  const fetchedCosmeticsUsers = useRef<Set<string>>(new Set());
  const chatStartTimeRef = useRef<number | null>(null);

  useTwitchWs();

  useEffect(() => {
    chatStartTimeRef.current = Date.now();
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

      // Mark as fetching to prevent duplicate requests
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

  const onClearChat = useCallback(() => {
    clearMessages();
    clearLocalMessages();
    setTimeout(() => {
      void listRef.current?.scrollToEnd({ animated: false });
    }, 0);
  }, [clearLocalMessages]);

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

      setReplyTo({
        messageId: message.message_id,
        username: message.sender,
        message: messageText,
        replyParentUserLogin: message.userstate.username || '',
        parentMessage: replaceEmotesWithText(
          parentMessage?.message as ParsedPart[],
        ),
        color: message.userstate.color,
      });
    },
    [messages$],
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

  const handleEmoteLongPress = useCallback((emote: EmotePressData) => {
    setSelectedEmote(emote);
    globalThis.requestAnimationFrame(() => {
      emotePreviewSheetRef.current?.present();
    });
  }, []);

  const handleBadgeLongPress = useCallback((badge: BadgePressData) => {
    setSelectedBadge(badge);
    globalThis.requestAnimationFrame(() => {
      badgePreviewSheetRef.current?.present();
    });
  }, []);

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      setSelectedMessage(data);
      actionSheetRef.current?.present();
    },
    [],
  );

  const handleActionSheetReply = useCallback(() => {
    if (!selectedMessage) return;
    handleReply(selectedMessage.messageData as ChatMessageType<'usernotice'>);
    actionSheetRef.current?.dismiss();
  }, [selectedMessage, handleReply]);

  const handleActionSheetCopy = useCallback(() => {
    if (!selectedMessage) return;
    const messageText = replaceEmotesWithText(selectedMessage.message);
    void Clipboard.setStringAsync(messageText).then(() =>
      toast.success('Copied to clipboard'),
    );
    actionSheetRef.current?.dismiss();
  }, [selectedMessage]);

  // Stable getMentionColor - uses observable peek() to avoid renderItem recreation
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
    [messages$], // messages$ is stable observable reference
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

  const castMessages = useCallback(
    (msgs: ChatMessageType<never>[]): AnyChatMessageType[] =>
      msgs as AnyChatMessageType[],
    [],
  );

  const userPaintsRef = useRef(userPaints);
  userPaintsRef.current = userPaints;

  const getLightenedColor = useCallback(
    (color: string | undefined): string | undefined => {
      if (!color) return undefined;
      const cached = lightenedColorCache.current.get(color);
      if (cached) return cached;
      const lightened = lightenColor(color);
      lightenedColorCache.current.set(color, lightened);
      // Limit cache size to prevent memory leak
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
  const handleReplyRef = useRef(handleReply);
  handleReplyRef.current = handleReply;
  const handleEmoteLongPressRef = useRef(handleEmoteLongPress);
  handleEmoteLongPressRef.current = handleEmoteLongPress;
  const handleBadgeLongPressRef = useRef(handleBadgeLongPress);
  handleBadgeLongPressRef.current = handleBadgeLongPress;
  const handleMessageLongPressRef = useRef(handleMessageLongPress);
  handleMessageLongPressRef.current = handleMessageLongPress;
  const getMentionColorRef = useRef(getMentionColor);
  getMentionColorRef.current = getMentionColor;
  const parseTextForEmotesRef = useRef(parseTextForEmotes);
  parseTextForEmotesRef.current = parseTextForEmotes;

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item: msg }: { item: AnyChatMessageType }) => {
      const { isSpecialNotice } = msg as { isSpecialNotice?: boolean };

      if (isSpecialNotice) {
        return (
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
            onReply={handleReplyRef.current}
            replyDisplayName={msg.replyDisplayName}
            replyBody={msg.replyBody}
            onEmotePress={handleEmoteLongPressRef.current}
            onBadgePress={handleBadgeLongPressRef.current}
            onMessageLongPress={handleMessageLongPressRef.current}
            getMentionColor={getMentionColorRef.current}
            parseTextForEmotes={parseTextForEmotesRef.current}
            userPaints={userPaintsRef.current}
            // @ts-expect-error - notice_tags union type not narrowing correctly
            notice_tags={
              'notice_tags' in msg && msg.notice_tags
                ? msg.notice_tags
                : undefined
            }
          />
        );
      }

      const senderColor =
        msg.cachedSenderColor ??
        getLightenedColorRef.current(msg.userstate.color);

      return (
        <ChatMessage
          messageId={msg.message_id}
          sender={msg.sender}
          senderColor={senderColor}
          message={msg.message}
          badges={msg.badges}
          isReply={Boolean(msg.parentDisplayName)}
          parentDisplayName={msg.parentDisplayName}
        />
      );
    },
    [], // Empty deps - callbacks accessed via refs
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
          {!connected && messages$.peek().length === 0 && (
            <View style={styles.connectingContainer}>
              <Text style={styles.connectingText}>
                Connecting to {channelName}&apos;s chat...
              </Text>
            </View>
          )}

          <FlashList
            data={castMessages(
              (Array.isArray(messages) ? messages : []).filter(
                (m): m is ChatMessageType<never> => m != null,
              ),
            )}
            ref={listRef}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            onScroll={handleScroll}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            scrollEventThrottle={16}
            maintainVisibleContentPosition={
              isAtBottom
                ? {
                    autoscrollToTopThreshold: 10,
                    autoscrollToBottomThreshold: 10,
                    startRenderingFromBottom: true,
                  }
                : undefined
            }
          />

          {!isAtBottom && !isScrollingToBottom && (
            <ResumeScroll
              unreadCount={unreadCount}
              onScrollToBottom={() => {
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
          onOpenDebugModal={() => debugModalRef.current?.present()}
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
          onRefetchEmotes={() => {
            void refetchEmotes().then(() => {
              // Reprocess existing messages with new emote/badge data
              reprocessAllMessages();
            });
          }}
          onReconnect={() => {
            partChannel(channelName);
            setTimeout(() => {
              joinChannel(channelName);
            }, 1000);
          }}
        />

        <ChatDebugModal
          ref={debugModalRef}
          onTestMessage={handleTestMessage}
          onClearChatCache={handleClearChatCache}
          onClearImageCache={() => void handleClearImageCache()}
        />

        {selectedEmote && (
          <EmotePreviewSheet
            ref={emotePreviewSheetRef}
            selectedEmote={selectedEmote}
          />
        )}

        {selectedBadge && (
          <BadgePreviewSheet
            ref={badgePreviewSheetRef}
            selectedBadge={selectedBadge}
          />
        )}

        {selectedMessage && (
          <ActionSheet
            ref={actionSheetRef}
            message={selectedMessage.message}
            username={selectedMessage.username}
            handleReply={handleActionSheetReply}
            handleCopy={handleActionSheetCopy}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
});

Chat.displayName = 'Chat';

const styles = StyleSheet.create(theme => ({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  listContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  connectingContainer: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  connectingText: {
    color: theme.colors.gray.accent,
    fontSize: theme.font.fontSize.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    minHeight: 50,
  },
}));

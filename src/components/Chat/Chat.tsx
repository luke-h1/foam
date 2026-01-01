import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useEmoteProcessor } from '@app/hooks/useEmoteProcessor';
import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { useTwitchWs } from '@app/hooks/useTwitchWs';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import {
  ChatMessageType,
  useMessages,
  useChannelEmoteData,
  clearChannelResources,
  clearTtvUsers,
  addMessage,
  clearMessages,
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  clearCache,
  abortCurrentLoad,
} from '@app/store/chatStore';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { findBadges } from '@app/utils/chat/findBadges';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { FlashListRef, ListRenderItem } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Platform, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { FlashList } from '../FlashList/FlashList';
import { Typography } from '../Typography/Typography';

import { ChatDebugModal, TestMessageType } from './components/ChatDebugModal';
import { ChatInputSection, ReplyToData } from './components/ChatInputSection';
import { ChatMessage } from './components/ChatMessage/ChatMessage';
import {
  EmoteSheet,
  EmotePickerItem,
} from './components/EmoteSheet/EmoteSheet';
import { ResumeScroll } from './components/ResumeScroll';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
import { useChatEmoteLoader } from './hooks/useChatEmoteLoader';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
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
  const messages = useMessages();
  const channelEmoteData = useChannelEmoteData(channelId);

  // Refs for lifecycle management
  const hasPartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const currentEmoteSetIdRef = useRef<string | null>(null);
  const emoteReprocessAttemptedRef = useRef<string | null>(null);
  const initializedChannelRef = useRef<string | null>(null);

  // UI refs
  const flashListRef = useRef<FlashListRef<AnyChatMessageType>>(null);
  const emoteSheetRef = useRef<TrueSheet>(null);
  const settingsSheetRef = useRef<TrueSheet>(null);
  const debugModalRef = useRef<BottomSheetModal>(null);
  const chatInputRef = useRef<TextInput>(null);

  // UI state
  const [connected, setConnected] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyToData | null>(null);
  const [, setIsInputFocused] = useState(false);

  // Hooks
  useTwitchWs();

  // Emote loading with graceful cancellation
  const {
    status: emoteLoadStatus,
    sevenTvEmoteSetId,
    refetch: refetchEmotes,
    cancel: cancelEmoteLoad,
  } = useChatEmoteLoader({
    channelId,
    enabled: true, // Load immediately
  });

  const emoteProcessor = useEmoteProcessor({
    sevenTvGlobalEmotes: channelEmoteData.sevenTvGlobalEmotes,
    sevenTvChannelEmotes: channelEmoteData.sevenTvChannelEmotes,
    twitchGlobalEmotes: channelEmoteData.twitchGlobalEmotes,
    twitchChannelEmotes: channelEmoteData.twitchChannelEmotes,
    ffzChannelEmotes: channelEmoteData.ffzChannelEmotes,
    ffzGlobalEmotes: channelEmoteData.ffzGlobalEmotes,
    bttvChannelEmotes: channelEmoteData.bttvChannelEmotes,
    bttvGlobalEmotes: channelEmoteData.bttvGlobalEmotes,
  });

  // Scroll management
  const {
    isAtBottom,
    isAtBottomRef,
    isScrollingToBottom,
    unreadCount,
    setUnreadCount,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
    cleanup: cleanupScroll,
  } = useChatScroll({ flashListRef, messagesLength: messages.length });

  // Auto-scroll callback for message handler
  const handleAutoScroll = useCallback(() => {
    if (isAtBottomRef.current && !isScrollingToBottom) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        void flashListRef.current?.scrollToIndex({
          index: lastIndex,
          animated: false,
        });
      }
    }
  }, [messages.length, isScrollingToBottom, isAtBottomRef]);

  // Message management
  const {
    handleNewMessage,
    clearLocalMessages,
    cleanup: cleanupMessages,
  } = useChatMessages({
    isAtBottomRef,
    isScrollingToBottom,
    onUnreadIncrement: useCallback(
      (count: number) => setUnreadCount(prev => prev + count),
      [setUnreadCount],
    ),
    onAutoScroll: handleAutoScroll,
  });

  // Process emotes for a message
  const processMessageEmotes = useCallback(
    (
      text: string,
      userstate: ReturnType<typeof createUserStateFromTags>,
      baseMessage: AnyChatMessageType,
    ) => {
      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) return;

      const hasEmotes =
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0;

      if (!hasEmotes) return;

      emoteProcessor.processEmotes(
        text.trimEnd(),
        userstate,
        replacedMessage => {
          try {
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
          }
        },
      );
    },
    [channelId, emoteProcessor, handleNewMessage],
  );

  // Reprocess all existing messages with current emote data (for refresh)
  const reprocessAllMessages = useCallback(() => {
    reprocessMessages(messages as AnyChatMessageType[], processMessageEmotes);
  }, [messages, processMessageEmotes]);

  // Chat handlers
  const onMessage = useCallback(
    (_channel: string, tags: Record<string, string>, text: string) => {
      const userstate = createUserStateFromTags(tags);
      const replyParentMessageId = tags['reply-parent-msg-id'];
      const replyParentDisplayName = tags['reply-parent-display-name'];

      let parentColor: string | undefined;
      if (replyParentDisplayName?.trim()) {
        if (replyParentMessageId) {
          const replyParent = messages.find(
            m => m?.message_id === replyParentMessageId,
          );
          parentColor =
            replyParent?.userstate.color ||
            generateRandomTwitchColor(replyParentDisplayName);
        } else {
          parentColor = generateRandomTwitchColor(replyParentDisplayName);
        }
      }

      const baseMessage = createBaseMessage({ tags, channelName, text });
      const messageWithParentColor = { ...baseMessage, parentColor };

      handleNewMessage(messageWithParentColor);
      processMessageEmotes(text, userstate, messageWithParentColor);
    },
    [channelName, handleNewMessage, messages, processMessageEmotes],
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
      void flashListRef.current?.scrollToIndex({
        index: messages.length - 1,
        animated: false,
      });
    }, 0);
  }, [messages.length, clearLocalMessages]);

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

  // Connection state polling
  useEffect(() => {
    const checkConnection = () => setConnected(isChatConnected());
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isChatConnected]);

  // SevenTV WebSocket
  const { subscribeToChannel, unsubscribeFromChannel, isConnected } =
    useSeventvWs({
      onEmoteUpdate: ({ added, removed, channelId: cId }) => {
        logger.stvWs.info(
          `Channel ${cId}: +${added.length} -${removed.length} emotes`,
        );
      },
      onEvent: eventType => {
        console.log(`SevenTV event: ${eventType}`);
      },
      twitchChannelId: channelId,
      sevenTvEmoteSetId,
    });

  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => setWsConnected(isConnected());
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // SevenTV subscription management
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
  }, [channelId, subscribeToChannel, unsubscribeFromChannel, wsConnected]);

  // Subscribe when emote data becomes available
  useEffect(() => {
    if (!wsConnected || !channelId || emoteLoadStatus !== 'success') return;

    const emoteSetId = getSevenTvEmoteSetId(channelId);
    if (emoteSetId && currentEmoteSetIdRef.current !== emoteSetId) {
      currentEmoteSetIdRef.current = emoteSetId;
      subscribeToChannel(emoteSetId);
    }
  }, [wsConnected, channelId, emoteLoadStatus, subscribeToChannel]);

  // Navigation cleanup - cancel all loads immediately for fast navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      abortCurrentLoad();
      cancelEmoteLoad();

      isMountedRef.current = false;
      clearChannelResources();

      if (!hasPartedRef.current) {
        hasPartedRef.current = true;
        partChannel(channelName);
      }

      clearMessages();
      clearLocalMessages();
      setConnected(false);
      initializedChannelRef.current = null;
      currentEmoteSetIdRef.current = null;
    });

    return () => {
      isMountedRef.current = false;
      hasPartedRef.current = false;

      abortCurrentLoad();
      cancelEmoteLoad();

      unsubscribe();
      clearChannelResources();
      clearTtvUsers();
      clearMessages();
      clearLocalMessages();
      cleanupScroll();
      cleanupMessages();
      currentEmoteSetIdRef.current = null;
    };
  }, [
    navigation,
    channelName,
    partChannel,
    clearLocalMessages,
    cleanupScroll,
    cleanupMessages,
    cancelEmoteLoad,
  ]);

  // Reprocess messages when emotes load
  useEffect(() => {
    if (emoteLoadStatus !== 'success') return;

    const hasEmotes =
      channelEmoteData.sevenTvGlobalEmotes.length > 0 ||
      channelEmoteData.sevenTvChannelEmotes.length > 0 ||
      channelEmoteData.twitchGlobalEmotes.length > 0 ||
      channelEmoteData.twitchChannelEmotes.length > 0 ||
      channelEmoteData.bttvGlobalEmotes.length > 0 ||
      channelEmoteData.bttvChannelEmotes.length > 0 ||
      channelEmoteData.ffzGlobalEmotes.length > 0 ||
      channelEmoteData.ffzChannelEmotes.length > 0;

    if (
      !hasEmotes ||
      emoteReprocessAttemptedRef.current === channelId ||
      messages.length === 0
    ) {
      if (hasEmotes && messages.length > 0) {
        emoteReprocessAttemptedRef.current = channelId;
      }
      return;
    }

    const textOnlyMessages = (messages as AnyChatMessageType[]).filter(msg => {
      if (msg.sender === 'System' || 'notice_tags' in msg) return false;
      return msg.message.every((part: ParsedPart) => part.type === 'text');
    });

    if (textOnlyMessages.length > 0) {
      emoteReprocessAttemptedRef.current = channelId;
      textOnlyMessages.forEach(msg => {
        const textContent = msg.message
          .filter((p: ParsedPart) => p.type === 'text')
          .map((p: ParsedPart) => (p as { content: string }).content)
          .join('');

        if (textContent.trim()) {
          processMessageEmotes(textContent, msg.userstate, msg);
        }
      });
    } else {
      emoteReprocessAttemptedRef.current = channelId;
    }
  }, [
    channelId,
    channelEmoteData,
    messages,
    emoteLoadStatus,
    processMessageEmotes,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    hasPartedRef.current = false;
    currentEmoteSetIdRef.current = null;
    emoteReprocessAttemptedRef.current = null;

    cleanupScroll();
    cleanupMessages();

    if (
      initializedChannelRef.current &&
      initializedChannelRef.current !== channelId
    ) {
      clearMessages();
      clearLocalMessages();
    }
    initializedChannelRef.current = channelId;

    return () => {
      isMountedRef.current = false;
      hasPartedRef.current = false;
      currentEmoteSetIdRef.current = null;
      cleanupScroll();
      cleanupMessages();
    };
  }, [channelId, clearLocalMessages, cleanupScroll, cleanupMessages]);

  // Send message handler
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
      parentColor: undefined,
    };

    handleNewMessage(optimisticMessage);
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
    handleNewMessage,
    getUserState,
    processMessageEmotes,
  ]);

  // Reply handler
  const handleReply = useCallback(
    (message: ChatMessageType<'usernotice'>) => {
      const messageText = replaceEmotesWithText(message.message);
      const parentMessage = messages.find(
        m => m?.message_id === message.message_id,
      );

      setReplyTo({
        messageId: message.message_id,
        username: message.sender,
        message: messageText,
        replyParentUserLogin: message.userstate.username || '',
        parentMessage: replaceEmotesWithText(
          parentMessage?.message as ParsedPart[],
        ),
      });
    },
    [messages],
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

  // Deduplicated messages for render
  const deduplicatedMessages = useMemo(() => {
    const messageMap = new Map<string, AnyChatMessageType>();
    messages.forEach(message => {
      const key = `${message?.message_id}_${message?.message_nonce}`;
      messageMap.set(key, message as AnyChatMessageType);
    });
    return Array.from(messageMap.values());
  }, [messages]);

  const renderItem: ListRenderItem<AnyChatMessageType> = useCallback(
    ({ item: msg }) => (
      <ChatMessage
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
        onReply={handleReply}
        replyDisplayName={msg.replyDisplayName}
        replyBody={msg.replyBody}
        allMessages={messages}
        // @ts-expect-error - notice_tags having issues being narrowed down
        notice_tags={
          'notice_tags' in msg && msg.notice_tags ? msg.notice_tags : undefined
        }
      />
    ),
    [handleReply, messages],
  );

  const keyExtractor = useCallback(
    (item: AnyChatMessageType) => `${item.message_id}_${item.message_nonce}`,
    [],
  );

  return (
    <View style={styles.wrapper}>
      <View style={{ paddingTop: insets.top }}>
        <Typography style={styles.header}>CHAT</Typography>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatContainer}>
          {!connected && deduplicatedMessages.length === 0 && (
            <View style={styles.connectingContainer}>
              <Typography style={styles.connectingText}>
                Connecting to {channelName}&apos;s chat...
              </Typography>
            </View>
          )}

          <FlashList
            data={deduplicatedMessages}
            ref={flashListRef}
            keyExtractor={keyExtractor}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            renderItem={renderItem}
            removeClippedSubviews
            contentInsetAdjustmentBehavior="automatic"
            drawDistance={500}
            overrideItemLayout={(layout, msg) => {
              const messageLength = msg.message?.length || 0;
              layout.span = Math.max(
                60,
                Math.min(120, 60 + messageLength * 0.5),
              );
            }}
          />

          {!isAtBottom && !isScrollingToBottom && (
            <ResumeScroll
              isAtBottomRef={isAtBottomRef}
              flashListRef={flashListRef}
              setIsAtBottom={() => {}}
              setUnreadCount={setUnreadCount}
              unreadCount={unreadCount}
              onScrollToBottom={scrollToBottom}
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
      </KeyboardAvoidingView>
    </View>
  );
});

Chat.displayName = 'Chat';

const styles = StyleSheet.create(theme => ({
  wrapper: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.md,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    maxWidth: '100%',
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

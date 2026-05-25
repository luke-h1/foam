import {
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { useAuthContext } from '@app/context/AuthContext';
import { useSeventvWs } from '@app/hooks/useSeventvWs';
import { sevenTvService } from '@app/services/seventv-service';
import {
  parseIrcMessage,
  recentMessagesService,
} from '@app/services/recent-messages-service';
import { useTwitchChat } from '@app/services/twitch-chat-service';
import { twitchService } from '@app/services/twitch-service';
import {
  getCurrentEmoteData,
  getSevenTvEmoteSetId,
  clearCache,
  updateSevenTvEmotes,
  fetchUserPersonalEmotes,
  getUserPersonalEmotes,
} from '@app/store/chatStore/channelLoad';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import {
  fetchAndCacheUserCosmetics,
  getUserBadge,
} from '@app/store/chatStore/cosmetics';
import { useChannelEmoteData } from '@app/store/chatStore/hooks';
import {
  addMessage,
  clearMessages,
  getMessageById,
  getMessageColor,
  getUserMessageColor,
  moderateMessageById,
  moderateMessagesByLogin,
  removeMessageById,
  restoreRecentMessagesForChannel,
  updateMessage,
} from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { SanitisedEmote } from '@app/types/emote';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { findBadges } from '@app/utils/chat/findBadges';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { extractEmotesFromTag } from '@app/utils/chat/extractEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { clearImageCache } from '@app/utils/image/clearImageCache';
import { logger } from '@app/utils/logger';
import { batch } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from 'expo-router';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import {
  View,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { formatDate } from '@app/utils/date-time/date';
import { ReadyState } from '@app/hooks/ws/constants';

import { Text } from '@app/components/ui/Text/Text';
import type { InputRef } from '@app/components/ui/Input/Input';
import { prefetchImage } from '@app/components/Image/Image';
import { SymbolView } from 'expo-symbols';
import { Button } from '@app/components/Button/Button';
import { ActionSheet } from './components/ActionSheet/ActionSheet';
import { BadgePreviewSheet } from './components/BadgePreviewSheet/BadgePreviewSheet';
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
import { useEmoteReprocessing } from './hooks/useEmoteReprocessing';
import {
  usePinnedChatMessage,
  type PinnedChatMessageViewModel,
} from './hooks/usePinnedChatMessage';
import {
  AnyChatMessageType,
  createUserStateFromTags,
  createBaseMessage,
  createUserNoticeMessage,
  createSystemMessage,
} from './util/messageHandlers';
import { isRenderableChatMessage } from './util/chatMessages';
import { normaliseChatUsername } from './util/chatUsernames';
import { formatNoticeMessage } from './util/formatNoticeMessage';
import { hydrateVisibleSevenTvAssets } from './util/hydrateVisibleSevenTvAssets';
import { reprocessMessages } from './util/reprocessMessages';
import {
  describeInitialRoomState,
  describeRoomStateChanges,
  parseRoomStateTags,
  SUPPRESSED_NOTICE_IDS,
  type ParsedRoomState,
} from './util/roomState';
import {
  getCachedSharedChatBadgeContext,
  getMessageBadges,
  getSharedChatBadgeContext,
} from './util/sharedChatBadges';
import { getVisibleMessages } from './util/visibleMessages';
import { cacheImageFromUrl } from '@app/utils/image/image-cache';

interface ChatProps {
  applyTopInset?: boolean;
  channelId: string;
  channelName: string;
  transparent?: boolean;
}

const VISIBLE_ASSET_HYDRATION_DELAY_MS = 150;

const PinnedMessageBanner = memo(
  ({
    canModerateChat,
    onRefresh,
    onUnpin,
    pinnedMessage,
    pinnedMessageBusy,
  }: {
    canModerateChat: boolean;
    onRefresh: () => void;
    onUnpin: () => void;
    pinnedMessage: PinnedChatMessageViewModel | null;
    pinnedMessageBusy: boolean;
  }) => {
    if (!pinnedMessage?.text.trim()) {
      return null;
    }

    const title = pinnedMessage.senderName
      ? `${pinnedMessage.senderName} pinned`
      : 'Pinned message';

    return (
      <View style={styles.pinnedMessageBanner}>
        <View style={styles.pinnedIconShell}>
          <SymbolView name="mappin" tintColor="#ffffff" size={16} />
        </View>
        <View style={styles.pinnedMessageContent}>
          <Text
            numberOfLines={1}
            style={styles.pinnedMessageTitle}
            weight="semibold"
          >
            {title}
          </Text>
          <Text numberOfLines={2} style={styles.pinnedMessageText}>
            {pinnedMessage.text}
          </Text>
        </View>
        {canModerateChat ? (
          <View style={styles.pinnedMessageActions}>
            <Button
              disabled={pinnedMessageBusy}
              label="Refresh pin"
              onPress={onRefresh}
              style={styles.pinnedMessageActionButton}
            >
              <SymbolView
                name="arrow.clockwise"
                tintColor="rgba(255,255,255,0.78)"
                size={14}
              />
            </Button>
            <Button
              disabled={pinnedMessageBusy}
              label="Unpin message"
              onPress={onUnpin}
              style={styles.pinnedMessageActionButton}
            >
              <SymbolView
                name="xmark"
                tintColor="rgba(255,255,255,0.78)"
                size={15}
              />
            </Button>
          </View>
        ) : null}
      </View>
    );
  },
);

PinnedMessageBanner.displayName = 'PinnedMessageBanner';

interface ChatMessagePaneProps {
  canModerateChat: boolean;
  channelId: string;
  channelName: string;
  connected: boolean;
  currentUsername?: string;
  hiddenUsers: string[];
  hiddenPhrases: string[];
  highlightedUsers: string[];
  showOnlyMentions: boolean;
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  isAtBottomRef: MutableRefObject<boolean>;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollEndDrag: () => void;
  handleMomentumScrollEnd: () => void;
  handleEndReached: () => void;
  handleContentSizeChange: () => void;
  renderItem: ListRenderItem<AnyChatMessageType | undefined>;
  keyExtractor: (item: AnyChatMessageType | undefined, index: number) => string;
  getItemType: (item: AnyChatMessageType | undefined) => string;
  listContentStyle: StyleProp<ViewStyle>;
  messageListExtraData?: unknown;
  onClearFilters: () => void;
  onRefreshPinnedMessage: () => void;
  onUnpinPinnedMessage: () => void;
  onToggleShowOnlyMentions: () => void;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
  pinnedMessage: PinnedChatMessageViewModel | null;
  pinnedMessageBusy: boolean;
}

interface ChatInputShellHandle {
  appendEmote: (emoteName: string) => void;
  appendMention: (username: string) => void;
  clearReply: () => void;
  setReplyTo: (replyTo: ReplyToData | null) => void;
}

interface ChatOverlayControllerHandle {
  openBadge: (badge: BadgePressData) => void;
  openEmotePreview: (emote: EmotePressData) => void;
  openEmoteSheet: () => void;
  openMessageActions: (message: MessageActionData<'usernotice'>) => void;
  openSettingsSheet: () => void;
  openUserActions: (user: UsernamePressData) => void;
}

interface ChatInputShellProps {
  canPinNextMessage: boolean;
  channelId: string;
  channelName: string;
  connected: boolean;
  getUserState: () => Record<string, string>;
  isChatConnected: () => boolean;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onPinnedMessageChanged: (message: PinnedChatMessageViewModel) => void;
  processMessageEmotes: (
    text: string,
    userstate: ReturnType<typeof createUserStateFromTags>,
    baseMessage: AnyChatMessageType,
    userId?: string,
    countUnread?: boolean,
  ) => void | Promise<void>;
  sendMessage: (
    channel: string,
    message: string,
    replyParentMsgId?: string,
    replyParentDisplayName?: string,
    replyParentMsgBody?: string,
  ) => void;
  user: ReturnType<typeof useAuthContext>['user'];
}

interface ChatOverlayLayerProps {
  canDeleteSelectedMessage: boolean;
  canModerateChat: boolean;
  canModerateSelectedMessageUser: boolean;
  canModerateSelectedUser: boolean;
  canPinSelectedMessage: boolean;
  connected: boolean;
  disableEmoteAnimations: boolean;
  emoteSheetRef: RefObject<TrueSheet | null>;
  highlightedUsers: string[];
  hiddenUsers: string[];
  onActionSheetBanUser: () => void;
  onActionSheetCopy: () => void;
  onActionSheetDeleteMessage: () => void;
  onActionSheetHidePhrase: () => void;
  onActionSheetHideUser: () => void;
  onActionSheetHighlightUser: () => void;
  onActionSheetPinMessage: () => void;
  onActionSheetReply: () => void;
  onActionSheetUpdatePinnedMessage: () => void;
  onActionSheetUnpinPinnedMessage: () => void;
  onActionSheetTimeoutUser: () => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onCloseSelectedBadge: () => void;
  onCloseSelectedEmote: () => void;
  onCloseSelectedMessage: () => void;
  onCloseSelectedUser: () => void;
  onCopySelectedUsername: () => void;
  onEmoteSheetDidDismiss: () => void;
  onEmoteSelect: (item: EmotePickerItem) => void;
  onSettingsSheetDidDismiss: () => void;
  onHighlightSelectedUser: () => void;
  onHideSelectedUser: () => void;
  onMentionSelectedUser: () => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onTimeoutSelectedUser: () => void;
  onToggleChatDensity: () => void;
  onToggleHighlightOwnMentions: (value: boolean) => void;
  onToggleInlineReplyContext: (value: boolean) => void;
  onToggleShowTimestamps: (value: boolean) => void;
  onToggleShowUnreadJumpPill: (value: boolean) => void;
  onBanSelectedUser: () => void;
  selectedBadge: BadgePressData | null;
  selectedEmote: EmotePressData | null;
  selectedMessage: MessageActionData<'usernotice'> | null;
  selectedUser: UsernamePressData | null;
  settingsSheetRef: RefObject<TrueSheet | null>;
  shouldRenderSettingsSheet: boolean;
  shouldRenderEmoteSheet: boolean;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  chatDensity: 'comfortable' | 'compact';
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
  showUnreadJumpPill: boolean;
}

interface ChatOverlayControllerProps {
  appendMentionToComposer: (username: string) => void;
  canModerateChat: boolean;
  channelId: string;
  channelName: string;
  connected: boolean;
  disableEmoteAnimations: boolean;
  emoteSheetRef: RefObject<TrueSheet | null>;
  handleReply: (message: ChatMessageType<'usernotice'>) => void;
  hiddenUsers: string[];
  highlightedUsers: string[];
  hidePhraseFromView: (phrase?: string) => void;
  hideUserFromView: (username?: string) => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
  onInsertEmote: (item: EmotePickerItem) => void;
  onPinMessage: (message: MessageActionData<'usernotice'>) => void;
  onRefreshPinnedMessage: (messageId: string) => void;
  onSettingsReconnect: () => void;
  onSettingsRefetchEmotes: () => void;
  onToggleChatDensity: () => void;
  onToggleHighlightOwnMentions: (value: boolean) => void;
  onToggleInlineReplyContext: (value: boolean) => void;
  onToggleShowTimestamps: (value: boolean) => void;
  onToggleShowUnreadJumpPill: (value: boolean) => void;
  onUnpinPinnedMessage: () => void;
  pinnedMessageBusy: boolean;
  pinnedMessageId?: string;
  sendChatCommand: (channel: string, message: string) => void;
  settingsSheetRef: RefObject<TrueSheet | null>;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
  showUnreadJumpPill: boolean;
  chatDensity: 'comfortable' | 'compact';
  highlightOwnMentions: boolean;
  toggleHighlightedUser: (username?: string) => void;
}

const ChatMessagePane = memo(
  ({
    canModerateChat,
    channelId,
    channelName,
    connected,
    currentUsername,
    hiddenUsers,
    hiddenPhrases,
    highlightedUsers,
    showOnlyMentions,
    listRef,
    isAtBottomRef,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    handleEndReached,
    handleContentSizeChange,
    renderItem,
    keyExtractor,
    getItemType,
    listContentStyle,
    messageListExtraData,
    onClearFilters,
    onRefreshPinnedMessage,
    onUnpinPinnedMessage,
    onToggleShowOnlyMentions,
    onViewableMessagesChange,
    pinnedMessage,
    pinnedMessageBusy,
  }: ChatMessagePaneProps) => {
    const storedMessages = useSelector(
      () => chatStore$.messages.get(true) as (AnyChatMessageType | undefined)[],
    );
    const rawMessages = useMemo(
      () => storedMessages.filter(isRenderableChatMessage),
      [storedMessages],
    );
    const hasMessages = rawMessages.length > 0;
    const hasEverHadMessagesRef = useRef(false);
    const lastEmptyLogAtRef = useRef<number>(0);

    const visibleMessageOptions = useMemo(
      () => ({
        currentUsername,
        hiddenUsers,
        hiddenPhrases,
        showOnlyMentions,
      }),
      [currentUsername, hiddenUsers, hiddenPhrases, showOnlyMentions],
    );

    const visibleMessages = useMemo(
      () => getVisibleMessages(rawMessages, visibleMessageOptions),
      [rawMessages, visibleMessageOptions],
    );

    const hasActiveFilters = useMemo(() => {
      return Boolean(
        hiddenUsers.length ||
        hiddenPhrases.length ||
        highlightedUsers.length ||
        showOnlyMentions,
      );
    }, [
      hiddenUsers.length,
      hiddenPhrases.length,
      highlightedUsers.length,
      showOnlyMentions,
    ]);

    const listData = visibleMessages;

    useEffect(() => {
      if (hasMessages) {
        hasEverHadMessagesRef.current = true;
      }
    }, [hasMessages]);

    useEffect(() => {
      if (!hasEverHadMessagesRef.current) {
        return;
      }
      if (hasMessages) {
        return;
      }

      const now = Date.now();
      if (now - lastEmptyLogAtRef.current < 2000) {
        return;
      }
      lastEmptyLogAtRef.current = now;

      logger.chat.warn('Chat messages became empty', {
        channelId,
        channelName,
      });
    }, [channelId, channelName, hasMessages]);

    return (
      <View style={styles.messagePane}>
        {!connected && !hasMessages && (
          <View style={styles.connectingContainer}>
            <Text style={styles.connectingText}>
              Connecting to {channelName}&apos;s chat...
            </Text>
          </View>
        )}

        <ChatViewControls
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          onToggleShowOnlyMentions={onToggleShowOnlyMentions}
          showOnlyMentions={showOnlyMentions}
        />

        <PinnedMessageBanner
          canModerateChat={canModerateChat}
          onRefresh={onRefreshPinnedMessage}
          onUnpin={onUnpinPinnedMessage}
          pinnedMessage={pinnedMessage}
          pinnedMessageBusy={pinnedMessageBusy}
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
          data={listData}
          listRef={listRef}
          isAtBottomRef={isAtBottomRef}
          handleScroll={handleScroll}
          handleScrollBeginDrag={handleScrollBeginDrag}
          handleScrollEndDrag={handleScrollEndDrag}
          handleMomentumScrollEnd={handleMomentumScrollEnd}
          handleEndReached={handleEndReached}
          handleContentSizeChange={handleContentSizeChange}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          extraData={messageListExtraData}
          contentContainerStyle={listContentStyle}
          onViewableMessagesChange={onViewableMessagesChange}
        />
      </View>
    );
  },
);

ChatMessagePane.displayName = 'ChatMessagePane';

const ChatEmoteRuntime = memo(
  ({
    channelId,
    emoteLoadStatus,
    messages$,
    processedMessageIdsRef,
    reprocessKey,
  }: {
    channelId: string;
    emoteLoadStatus: string;
    messages$: { peek: () => unknown[] };
    processedMessageIdsRef: MutableRefObject<Set<string>>;
    reprocessKey: string;
  }) => {
    const channelEmoteData = useChannelEmoteData(channelId);

    useEmoteReprocessing({
      channelId,
      channelEmoteData,
      messages$,
      emoteLoadStatus,
      processedMessageIdsRef,
      reprocessKey,
    });

    return null;
  },
);

ChatEmoteRuntime.displayName = 'ChatEmoteRuntime';

const ChatInputShell = memo(
  forwardRef<ChatInputShellHandle, ChatInputShellProps>(
    (
      {
        canPinNextMessage,
        channelId,
        channelName,
        connected,
        getUserState,
        isChatConnected,
        onOpenEmoteSheet,
        onOpenSettingsSheet,
        onPinnedMessageChanged,
        processMessageEmotes,
        sendMessage,
        user,
      },
      ref,
    ) => {
      const chatInputRef = useRef<InputRef>(null);
      const [messageInput, setMessageInput] = useState('');
      const [replyTo, setReplyTo] = useState<ReplyToData | null>(null);
      const [pinNextMessage, setPinNextMessage] = useState(false);
      const [isSendingPinnedMessage, setIsSendingPinnedMessage] =
        useState(false);
      const isAuthenticated = Boolean(user?.id && user?.login);
      const canPinCurrentMessage =
        canPinNextMessage && !replyTo && !isSendingPinnedMessage;

      const handleComposerTextChange = useCallback(
        (text: string) => {
          if (!isAuthenticated) {
            return;
          }
          setMessageInput(text);
        },
        [isAuthenticated],
      );

      const handleComposerEmoteSelect = useCallback(
        (emote: SanitisedEmote) => {
          if (!isAuthenticated) {
            return;
          }
          setMessageInput(
            prev => `${prev}${prev.length > 0 ? ' ' : ''}${emote.name} `,
          );
        },
        [isAuthenticated],
      );

      const handleClearReply = useCallback(() => {
        setReplyTo(null);
      }, []);

      useEffect(() => {
        if (!isAuthenticated) {
          setMessageInput('');
          setReplyTo(null);
          setPinNextMessage(false);
        }
      }, [isAuthenticated]);

      useEffect(() => {
        if (!canPinCurrentMessage) {
          setPinNextMessage(false);
        }
      }, [canPinCurrentMessage]);

      const handleTogglePinNextMessage = useCallback(() => {
        if (!canPinCurrentMessage) {
          return;
        }

        setPinNextMessage(value => !value);
      }, [canPinCurrentMessage]);

      const handleSendMessage = useCallback(async () => {
        if (!messageInput.trim()) {
          return;
        }
        if (!isAuthenticated) {
          logger.chat.warn('Cannot send chat message while signed out');
          return;
        }

        if (!isChatConnected()) {
          logger.chat.warn(
            'Sending chat message while IRC join state is stale',
          );
        }

        const messageText = replyTo
          ? `@${replyTo.username} ${messageInput}`
          : messageInput;
        const shouldPinMessage = canPinCurrentMessage && pinNextMessage;
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

        let optimisticMessageId = `${Date.now()}`;
        if (shouldPinMessage) {
          setIsSendingPinnedMessage(true);
          try {
            const sendResult = await twitchService.sendChatMessage({
              broadcasterId: channelId,
              message: messageText,
              pin: true,
              senderId: user?.id ?? '',
            });
            optimisticMessageId = sendResult?.message_id || optimisticMessageId;
          } catch (error) {
            logger.chat.error('issue sending pinned message', error);
            toast.error('Could not send pinned message');
            setIsSendingPinnedMessage(false);
            return;
          }
        }

        const optimisticMessage: AnyChatMessageType = {
          id: `${optimisticMessageId}_${optimisticMessageId}`,
          userstate: optimisticUserstate,
          message: [{ type: 'text', content: messageText.trimEnd() }],
          badges: userBadges,
          channel: channelName,
          message_id: optimisticMessageId,
          message_nonce: optimisticMessageId,
          timestamp: formatDate(Date.now(), 'HH:mm'),
          sender: senderName,
          parentDisplayName: replyTo?.username || '',
          replyDisplayName: replyTo?.replyParentUserLogin || '',
          replyBody: replyTo?.message || '',
          parentColor: replyTo?.color,
        };

        void processMessageEmotes(
          messageText,
          optimisticUserstate,
          optimisticMessage,
          undefined,
          false,
        );

        if (shouldPinMessage) {
          onPinnedMessageChanged({
            messageId: optimisticMessage.message_id,
            senderName,
            text: messageText.trimEnd(),
          });
          toast.success('Message pinned');
          setIsSendingPinnedMessage(false);
        } else if (replyTo) {
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
        setPinNextMessage(false);
      }, [
        canPinCurrentMessage,
        channelId,
        channelName,
        getUserState,
        isChatConnected,
        isAuthenticated,
        messageInput,
        onPinnedMessageChanged,
        pinNextMessage,
        processMessageEmotes,
        replyTo,
        sendMessage,
        user,
      ]);

      useImperativeHandle(
        ref,
        () => ({
          appendEmote: (emoteName: string) => {
            if (!isAuthenticated) {
              return;
            }
            setMessageInput(
              prev => `${prev}${prev.length > 0 ? ' ' : ''}${emoteName} `,
            );
          },
          appendMention: (username: string) => {
            if (!isAuthenticated) {
              return;
            }
            setMessageInput(prev => {
              const trimmed = prev.trim();
              if (!trimmed) {
                return `@${username} `;
              }

              return `${prev}${prev.endsWith(' ') ? '' : ' '}@${username} `;
            });
            chatInputRef.current?.focus();
          },
          clearReply: () => {
            setReplyTo(null);
          },
          setReplyTo: nextReplyTo => {
            if (!isAuthenticated) {
              return;
            }
            setReplyTo(nextReplyTo);
          },
        }),
        [isAuthenticated],
      );

      return (
        <ChatInputSection
          messageInput={messageInput}
          onChangeText={handleComposerTextChange}
          onEmoteSelect={handleComposerEmoteSelect}
          onSubmit={handleSendMessage}
          onOpenEmoteSheet={onOpenEmoteSheet}
          onOpenSettingsSheet={onOpenSettingsSheet}
          replyTo={replyTo}
          onClearReply={handleClearReply}
          isConnected={connected}
          isAuthenticated={isAuthenticated}
          canPinNextMessage={canPinCurrentMessage}
          inputRef={chatInputRef}
          isSending={isSendingPinnedMessage}
          onTogglePinNextMessage={handleTogglePinNextMessage}
          pinNextMessage={pinNextMessage}
        />
      );
    },
  ),
);

ChatInputShell.displayName = 'ChatInputShell';

const ChatOverlayController = memo(
  forwardRef<ChatOverlayControllerHandle, ChatOverlayControllerProps>(
    (
      {
        appendMentionToComposer,
        canModerateChat,
        channelId,
        channelName,
        connected,
        disableEmoteAnimations,
        emoteSheetRef,
        handleReply,
        hiddenUsers,
        highlightedUsers,
        hidePhraseFromView,
        hideUserFromView,
        onClearChatCache,
        onClearImageCache,
        onInsertEmote,
        onPinMessage,
        onRefreshPinnedMessage,
        onSettingsReconnect,
        onSettingsRefetchEmotes,
        onToggleChatDensity,
        onToggleHighlightOwnMentions,
        onToggleInlineReplyContext,
        onToggleShowTimestamps,
        onToggleShowUnreadJumpPill,
        onUnpinPinnedMessage,
        pinnedMessageBusy,
        pinnedMessageId,
        sendChatCommand,
        settingsSheetRef,
        showInlineReplyContext,
        showTimestamps,
        showUnreadJumpPill,
        chatDensity,
        highlightOwnMentions,
        toggleHighlightedUser,
      },
      ref,
    ) => {
      const [selectedBadge, setSelectedBadge] = useState<BadgePressData | null>(
        null,
      );
      const [selectedMessage, setSelectedMessage] =
        useState<MessageActionData<'usernotice'> | null>(null);
      const [selectedEmote, setSelectedEmote] = useState<EmotePressData | null>(
        null,
      );
      const [selectedUser, setSelectedUser] =
        useState<UsernamePressData | null>(null);
      const [isEmoteSheetMounted, setIsEmoteSheetMounted] = useState(false);
      const [isSettingsSheetMounted, setIsSettingsSheetMounted] =
        useState(false);

      useEffect(() => {
        setSelectedBadge(null);
        setSelectedMessage(null);
        setSelectedEmote(null);
        setSelectedUser(null);
        setIsEmoteSheetMounted(false);
        setIsSettingsSheetMounted(false);
      }, [channelId]);

      useEffect(() => {
        if (!isEmoteSheetMounted) {
          return;
        }

        const presentId = setTimeout(() => {
          void emoteSheetRef.current?.present();
        }, 0);

        return () => clearTimeout(presentId);
      }, [emoteSheetRef, isEmoteSheetMounted]);

      useEffect(() => {
        if (!isSettingsSheetMounted) {
          return;
        }

        const presentId = setTimeout(() => {
          void settingsSheetRef.current?.present();
        }, 0);

        return () => clearTimeout(presentId);
      }, [isSettingsSheetMounted, settingsSheetRef]);

      useImperativeHandle(
        ref,
        () => ({
          openBadge: setSelectedBadge,
          openEmotePreview: setSelectedEmote,
          openEmoteSheet: () => setIsEmoteSheetMounted(true),
          openMessageActions: setSelectedMessage,
          openSettingsSheet: () => setIsSettingsSheetMounted(true),
          openUserActions: setSelectedUser,
        }),
        [],
      );

      const canModerateSelectedMessageUser = useMemo(() => {
        return Boolean(
          selectedMessage?.login?.trim() || selectedMessage?.username?.trim(),
        );
      }, [selectedMessage?.login, selectedMessage?.username]);

      const canDeleteSelectedMessage = useMemo(() => {
        return Boolean(selectedMessage?.messageData.message_id?.trim());
      }, [selectedMessage?.messageData.message_id]);

      const canPinSelectedMessage = useMemo(() => {
        return Boolean(
          !pinnedMessageBusy && selectedMessage?.messageData.message_id?.trim(),
        );
      }, [pinnedMessageBusy, selectedMessage?.messageData.message_id]);

      const canModerateSelectedUser = useMemo(() => {
        return Boolean(
          selectedUser?.login?.trim() || selectedUser?.username.trim(),
        );
      }, [selectedUser?.login, selectedUser?.username]);

      const handleEmoteSheetDidDismiss = useCallback(() => {
        setIsEmoteSheetMounted(false);
      }, []);

      const handleSettingsSheetDidDismiss = useCallback(() => {
        setIsSettingsSheetMounted(false);
      }, []);

      const handleActionSheetReply = useCallback(() => {
        if (!selectedMessage) {
          return;
        }
        handleReply(selectedMessage.messageData);
        setSelectedMessage(null);
      }, [handleReply, selectedMessage]);

      const handleActionSheetCopy = useCallback(() => {
        if (!selectedMessage) {
          return;
        }
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

      const handleActionSheetDeleteMessage = useCallback(() => {
        const messageId = selectedMessage?.messageData.message_id?.trim();
        if (!messageId) {
          return;
        }

        sendChatCommand(channelName, `/delete ${messageId}`);
        toast.success('Delete command sent');
        setSelectedMessage(null);
      }, [
        channelName,
        selectedMessage?.messageData.message_id,
        sendChatCommand,
      ]);

      const handleActionSheetPinMessage = useCallback(() => {
        if (!selectedMessage) {
          return;
        }

        onPinMessage(selectedMessage);
        setSelectedMessage(null);
      }, [onPinMessage, selectedMessage]);

      const handleActionSheetUpdatePinnedMessage = useCallback(() => {
        const messageId = selectedMessage?.messageData.message_id?.trim();
        if (!messageId) {
          return;
        }

        onRefreshPinnedMessage(messageId);
        setSelectedMessage(null);
      }, [onRefreshPinnedMessage, selectedMessage?.messageData.message_id]);

      const handleActionSheetUnpinPinnedMessage = useCallback(() => {
        onUnpinPinnedMessage();
        setSelectedMessage(null);
      }, [onUnpinPinnedMessage]);

      const handleActionSheetTimeoutUser = useCallback(() => {
        const target =
          selectedMessage?.login?.trim() || selectedMessage?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/timeout ${target} 600`);
        toast.success(`Timeout command sent for ${target}`);
        setSelectedMessage(null);
      }, [
        channelName,
        selectedMessage?.login,
        selectedMessage?.username,
        sendChatCommand,
      ]);

      const handleActionSheetBanUser = useCallback(() => {
        const target =
          selectedMessage?.login?.trim() || selectedMessage?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/ban ${target}`);
        toast.success(`Ban command sent for ${target}`);
        setSelectedMessage(null);
      }, [
        channelName,
        selectedMessage?.login,
        selectedMessage?.username,
        sendChatCommand,
      ]);

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

      const handleTimeoutSelectedUser = useCallback(() => {
        const target =
          selectedUser?.login?.trim() || selectedUser?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/timeout ${target} 600`);
        toast.success(`Timeout command sent for ${target}`);
        setSelectedUser(null);
      }, [channelName, selectedUser, sendChatCommand]);

      const handleBanSelectedUser = useCallback(() => {
        const target =
          selectedUser?.login?.trim() || selectedUser?.username?.trim();
        if (!target) {
          return;
        }

        sendChatCommand(channelName, `/ban ${target}`);
        toast.success(`Ban command sent for ${target}`);
        setSelectedUser(null);
      }, [channelName, selectedUser, sendChatCommand]);

      const handleCloseSelectedBadge = useCallback(() => {
        setSelectedBadge(null);
      }, []);

      const handleCloseSelectedEmote = useCallback(() => {
        setSelectedEmote(null);
      }, []);

      const handleCloseSelectedMessage = useCallback(() => {
        setSelectedMessage(null);
      }, []);

      const handleCloseSelectedUser = useCallback(() => {
        setSelectedUser(null);
      }, []);

      const handleEmoteSelect = useCallback(
        (item: EmotePickerItem) => {
          onInsertEmote(item);
          setIsEmoteSheetMounted(false);
        },
        [onInsertEmote],
      );

      return (
        <ChatOverlayLayer
          canDeleteSelectedMessage={canDeleteSelectedMessage}
          canModerateChat={canModerateChat}
          canModerateSelectedMessageUser={canModerateSelectedMessageUser}
          canModerateSelectedUser={canModerateSelectedUser}
          canPinSelectedMessage={canPinSelectedMessage}
          connected={connected}
          disableEmoteAnimations={disableEmoteAnimations}
          emoteSheetRef={emoteSheetRef}
          highlightedUsers={highlightedUsers}
          hiddenUsers={hiddenUsers}
          onActionSheetBanUser={handleActionSheetBanUser}
          onActionSheetCopy={handleActionSheetCopy}
          onActionSheetDeleteMessage={handleActionSheetDeleteMessage}
          onActionSheetHidePhrase={handleActionSheetHidePhrase}
          onActionSheetHideUser={handleActionSheetHideUser}
          onActionSheetHighlightUser={handleActionSheetHighlightUser}
          onActionSheetPinMessage={handleActionSheetPinMessage}
          onActionSheetReply={handleActionSheetReply}
          onActionSheetUpdatePinnedMessage={
            handleActionSheetUpdatePinnedMessage
          }
          onActionSheetUnpinPinnedMessage={handleActionSheetUnpinPinnedMessage}
          onActionSheetTimeoutUser={handleActionSheetTimeoutUser}
          onBanSelectedUser={handleBanSelectedUser}
          onClearChatCache={onClearChatCache}
          onClearImageCache={onClearImageCache}
          onCloseSelectedBadge={handleCloseSelectedBadge}
          onCloseSelectedEmote={handleCloseSelectedEmote}
          onCloseSelectedMessage={handleCloseSelectedMessage}
          onCloseSelectedUser={handleCloseSelectedUser}
          onCopySelectedUsername={handleCopySelectedUsername}
          onEmoteSheetDidDismiss={handleEmoteSheetDidDismiss}
          onEmoteSelect={handleEmoteSelect}
          onSettingsSheetDidDismiss={handleSettingsSheetDidDismiss}
          onHighlightSelectedUser={handleHighlightSelectedUser}
          onHideSelectedUser={handleHideSelectedUser}
          onMentionSelectedUser={handleMentionSelectedUser}
          onSettingsReconnect={onSettingsReconnect}
          onSettingsRefetchEmotes={onSettingsRefetchEmotes}
          onTimeoutSelectedUser={handleTimeoutSelectedUser}
          onToggleChatDensity={onToggleChatDensity}
          onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
          onToggleInlineReplyContext={onToggleInlineReplyContext}
          onToggleShowTimestamps={onToggleShowTimestamps}
          onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
          selectedBadge={selectedBadge}
          selectedEmote={selectedEmote}
          selectedMessage={selectedMessage}
          selectedUser={selectedUser}
          settingsSheetRef={settingsSheetRef}
          shouldRenderSettingsSheet={isSettingsSheetMounted}
          shouldRenderEmoteSheet={isEmoteSheetMounted}
          pinnedMessageBusy={pinnedMessageBusy}
          pinnedMessageId={pinnedMessageId}
          chatDensity={chatDensity}
          highlightOwnMentions={highlightOwnMentions}
          showInlineReplyContext={showInlineReplyContext}
          showTimestamps={showTimestamps}
          showUnreadJumpPill={showUnreadJumpPill}
        />
      );
    },
  ),
);

ChatOverlayController.displayName = 'ChatOverlayController';

const ChatOverlayLayer = memo(
  ({
    canDeleteSelectedMessage,
    canModerateChat,
    canModerateSelectedMessageUser,
    canModerateSelectedUser,
    canPinSelectedMessage,
    connected,
    disableEmoteAnimations,
    emoteSheetRef,
    highlightedUsers,
    hiddenUsers,
    onActionSheetBanUser,
    onActionSheetCopy,
    onActionSheetDeleteMessage,
    onActionSheetHidePhrase,
    onActionSheetHideUser,
    onActionSheetHighlightUser,
    onActionSheetPinMessage,
    onActionSheetReply,
    onActionSheetUpdatePinnedMessage,
    onActionSheetUnpinPinnedMessage,
    onActionSheetTimeoutUser,
    onBanSelectedUser,
    onClearChatCache,
    onClearImageCache,
    onCloseSelectedBadge,
    onCloseSelectedEmote,
    onCloseSelectedMessage,
    onCloseSelectedUser,
    onCopySelectedUsername,
    onEmoteSheetDidDismiss,
    onEmoteSelect,
    onSettingsSheetDidDismiss,
    onHighlightSelectedUser,
    onHideSelectedUser,
    onMentionSelectedUser,
    onSettingsReconnect,
    onSettingsRefetchEmotes,
    onTimeoutSelectedUser,
    onToggleChatDensity,
    onToggleHighlightOwnMentions,
    onToggleInlineReplyContext,
    onToggleShowTimestamps,
    onToggleShowUnreadJumpPill,
    selectedBadge,
    selectedEmote,
    selectedMessage,
    selectedUser,
    settingsSheetRef,
    shouldRenderSettingsSheet,
    shouldRenderEmoteSheet,
    pinnedMessageBusy,
    pinnedMessageId,
    chatDensity,
    highlightOwnMentions,
    showInlineReplyContext,
    showTimestamps,
    showUnreadJumpPill,
  }: ChatOverlayLayerProps) => {
    return (
      <>
        {connected && shouldRenderEmoteSheet ? (
          <EmoteSheet
            ref={emoteSheetRef}
            onDidDismiss={onEmoteSheetDidDismiss}
            onEmoteSelect={onEmoteSelect}
          />
        ) : null}

        {shouldRenderSettingsSheet ? (
          <SettingsSheet
            ref={settingsSheetRef}
            chatDensity={chatDensity}
            highlightOwnMentions={highlightOwnMentions}
            onClearChatCache={onClearChatCache}
            onClearImageCache={onClearImageCache}
            onDidDismiss={onSettingsSheetDidDismiss}
            onRefetchEmotes={onSettingsRefetchEmotes}
            onReconnect={onSettingsReconnect}
            onToggleChatDensity={onToggleChatDensity}
            onToggleHighlightOwnMentions={onToggleHighlightOwnMentions}
            onToggleInlineReplyContext={onToggleInlineReplyContext}
            onToggleShowTimestamps={onToggleShowTimestamps}
            onToggleShowUnreadJumpPill={onToggleShowUnreadJumpPill}
            showInlineReplyContext={showInlineReplyContext}
            showTimestamps={showTimestamps}
            showUnreadJumpPill={showUnreadJumpPill}
          />
        ) : null}

        {selectedBadge ? (
          <BadgePreviewSheet
            visible
            onClose={onCloseSelectedBadge}
            selectedBadge={selectedBadge}
          />
        ) : null}

        {selectedEmote ? (
          <EmotePreviewSheet
            disableAnimations={disableEmoteAnimations}
            visible
            onClose={onCloseSelectedEmote}
            selectedEmote={selectedEmote}
          />
        ) : null}

        {selectedMessage ? (
          <ActionSheet
            visible
            onClose={onCloseSelectedMessage}
            message={selectedMessage.message}
            username={selectedMessage.username}
            handleReply={onActionSheetReply}
            handleCopy={onActionSheetCopy}
            handleHidePhrase={onActionSheetHidePhrase}
            handleHideUser={onActionSheetHideUser}
            handleHighlightUser={onActionSheetHighlightUser}
            handlePinMessage={onActionSheetPinMessage}
            handleUpdatePinnedMessage={onActionSheetUpdatePinnedMessage}
            handleUnpinMessage={onActionSheetUnpinPinnedMessage}
            handleDeleteMessage={onActionSheetDeleteMessage}
            handleTimeoutUser={onActionSheetTimeoutUser}
            handleBanUser={onActionSheetBanUser}
            canModerateChat={canModerateChat}
            canDeleteMessage={canDeleteSelectedMessage}
            canPinMessage={canPinSelectedMessage}
            canModerateUser={canModerateSelectedMessageUser}
            isPinnedMessage={
              pinnedMessageId === selectedMessage.messageData.message_id
            }
            isPinnedMessageBusy={pinnedMessageBusy}
            isUserHighlighted={Boolean(
              selectedMessage.username &&
              highlightedUsers.includes(selectedMessage.username.toLowerCase()),
            )}
          />
        ) : null}

        {selectedUser ? (
          <UserActionSheet
            visible
            onClose={onCloseSelectedUser}
            username={selectedUser.username}
            login={selectedUser.login}
            onMentionUser={onMentionSelectedUser}
            onCopyUsername={onCopySelectedUsername}
            onHideUser={onHideSelectedUser}
            onHighlightUser={onHighlightSelectedUser}
            onTimeoutUser={onTimeoutSelectedUser}
            onBanUser={onBanSelectedUser}
            isHidden={hiddenUsers.includes(selectedUser.username.toLowerCase())}
            isHighlighted={highlightedUsers.includes(
              selectedUser.username.toLowerCase(),
            )}
            canModerateChat={canModerateChat}
            canModerateUser={canModerateSelectedUser}
          />
        ) : null}
      </>
    );
  },
);

ChatOverlayLayer.displayName = 'ChatOverlayLayer';

export const Chat = memo(
  ({
    applyTopInset = true,
    channelName,
    channelId,
    transparent = false,
  }: ChatProps) => {
    const { user } = useAuthContext();
    const preferences = usePreferences();
    const showRecentMessages = preferences.showRecentMessages !== false;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const messages$ = chatStore$.messages;
    const currentUsername = user?.login ?? user?.display_name;

    const processedMessageIdsRef = useRef<Set<string>>(new Set());
    const visiblePersonalEmoteUsersRef = useRef<Set<string>>(new Set());
    const visibleCosmeticUsersRef = useRef<Set<string>>(new Set());
    const hydratedVisibleAssetKeysRef = useRef<Set<string>>(new Set());
    const pendingVisibleMessagesRef = useRef<AnyChatMessageType[]>([]);
    const visibleAssetHydrationTimerRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);
    const listRef = useRef<FlashListRef<AnyChatMessageType> | null>(null);
    const emoteSheetRef = useRef<TrueSheet>(null);
    const settingsSheetRef = useRef<TrueSheet>(null);
    const inputShellRef = useRef<ChatInputShellHandle>(null);
    const overlayControllerRef = useRef<ChatOverlayControllerHandle>(null);
    const [hiddenUsers, setHiddenUsers] = useState<string[]>([]);
    const [hiddenPhrases, setHiddenPhrases] = useState<string[]>([]);
    const [highlightedUsers, setHighlightedUsers] = useState<string[]>([]);
    const [
      highlightedReplyTargetMessageId,
      setHighlightedReplyTargetMessageId,
    ] = useState<string | undefined>(undefined);
    const [showOnlyMentions, setShowOnlyMentions] = useState(false);

    const mentionColorCache = useRef<Map<string, string>>(new Map());
    const fetchedCosmeticsUsers = useRef<Set<string>>(new Set());
    const chatStartTimeRef = useRef<number | null>(null);
    const highlightedReplyTargetTimeoutRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

    useEffect(() => {
      chatStartTimeRef.current = Date.now();
    }, [channelId]);

    useEffect(() => {
      setHiddenUsers([]);
      setHiddenPhrases([]);
      setHighlightedUsers([]);
      setHighlightedReplyTargetMessageId(undefined);
      setShowOnlyMentions(false);
      visiblePersonalEmoteUsersRef.current.clear();
      visibleCosmeticUsersRef.current.clear();
      hydratedVisibleAssetKeysRef.current.clear();
    }, [channelId]);

    useEffect(() => {
      return () => {
        if (highlightedReplyTargetTimeoutRef.current) {
          clearTimeout(highlightedReplyTargetTimeoutRef.current);
          highlightedReplyTargetTimeoutRef.current = null;
        }
        if (visibleAssetHydrationTimerRef.current) {
          clearTimeout(visibleAssetHydrationTimerRef.current);
          visibleAssetHydrationTimerRef.current = null;
        }
      };
    }, []);

    const canFetchCosmetics = useCallback((): boolean => {
      const chatStartTime = chatStartTimeRef.current;
      if (!chatStartTime) {
        return true;
      }

      const elapsedSeconds = (Date.now() - chatStartTime) / 1000;
      return elapsedSeconds <= 5;
    }, []);

    const fetchUserCosmetics = useCallback(
      async (
        twitchUserId: string,
        options: {
          allowAfterInitialWindow?: boolean;
          retryMissingBadge?: boolean;
        } = {},
      ) => {
        const existingBadgeId = chatStore$.userBadgeIds[twitchUserId]?.peek();
        if (
          fetchedCosmeticsUsers.current.has(twitchUserId) &&
          (!options.retryMissingBadge || existingBadgeId)
        ) {
          return;
        }

        if (!options.allowAfterInitialWindow && !canFetchCosmetics()) {
          const chatStartTime = chatStartTimeRef.current;
          const elapsedSeconds = chatStartTime
            ? (Date.now() - chatStartTime) / 1000
            : 0;
          logger.stvWs.debug(
            `Skipping cosmetic fetch for ${twitchUserId} - chat has been active for ${elapsedSeconds.toFixed(1)}s (limit: 5s)`,
          );
          return;
        }

        const existingPaintId = chatStore$.userPaintIds[twitchUserId]?.peek();
        if (existingPaintId && existingBadgeId) {
          fetchedCosmeticsUsers.current.add(twitchUserId);
          logger.stvWs.debug(
            `User ${twitchUserId} already has paint and badge cosmetics`,
          );
          return;
        }

        fetchedCosmeticsUsers.current.add(twitchUserId);

        try {
          logger.stvWs.info(`Fetching cosmetics for user ${twitchUserId}...`);

          const sevenTvUserId = await sevenTvService.get7tvUserId(twitchUserId);

          if (sevenTvUserId) {
            logger.stvWs.info(
              `Got 7TV user ID ${sevenTvUserId} for Twitch user ${twitchUserId}`,
            );
            await fetchAndCacheUserCosmetics(sevenTvUserId);
            logger.stvWs.info(
              `Finished fetching cosmetics for ${twitchUserId}`,
            );
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
    const chatAssetPreferenceKey = useMemo(
      () =>
        [
          preferences.emojiStyle,
          preferences.show7TvEmotes,
          preferences.showBttvEmotes,
          preferences.showFFzEmotes,
          preferences.showTwitchEmotes,
          preferences.show7tvBadges,
          preferences.showBttvBadges,
          preferences.showFFzBadges,
          preferences.showTwitchBadges,
          preferences.showChatterinoEmotes,
        ].join('|'),
      [
        preferences.emojiStyle,
        preferences.show7TvEmotes,
        preferences.showBttvEmotes,
        preferences.showFFzEmotes,
        preferences.showTwitchEmotes,
        preferences.show7tvBadges,
        preferences.showBttvBadges,
        preferences.showFFzBadges,
        preferences.showTwitchBadges,
        preferences.showChatterinoEmotes,
      ],
    );

    const getMessagesLength = useCallback(
      () => messages$.peek().length,
      [messages$],
    );

    const {
      isAtBottom,
      isAtBottomRef,
      isScrollingToBottom,
      isScrollingToBottomRef,
      unreadCount,
      setUnreadCount,
      handleScroll,
      handleScrollBeginDrag,
      handleScrollEndDrag,
      handleMomentumScrollEnd,
      handleEndReached,
      handleContentSizeChange,
      scrollToBottom,
      maintainBottomAfterContentChange,
      cleanup: cleanupScroll,
    } = useChatScroll({
      listRef,
      getMessagesLength,
    });

    const {
      handleNewMessage,
      clearLocalMessages,
      moderateBufferedMessageById,
      moderateBufferedMessagesByLogin,
      removeBufferedMessageById,
      cleanup: cleanupMessages,
      forceFlush,
    } = useChatMessages({
      isAtBottomRef,
      isScrollingToBottomRef,
      onUnreadIncrement: useCallback(
        (count: number) => setUnreadCount(prev => prev + count),
        [setUnreadCount],
      ),
    });
    const roomStateRef = useRef<ParsedRoomState | null>(null);

    const appendSystemMessage = useCallback(
      (content: string) => {
        addMessage(
          createSystemMessage(channelName, content) as ChatMessageType<never>,
        );
      },
      [channelName],
    );

    const processMessageEmotes = useCallback(
      (
        text: string,
        userstate: ReturnType<typeof createUserStateFromTags>,
        baseMessage: AnyChatMessageType,
        userId?: string,
        countUnread = true,
      ) => {
        const emoteData = getCurrentEmoteData(channelId);
        if (!emoteData) {
          handleNewMessage(baseMessage, { countUnread });
          return;
        }

        const hasEmotes =
          chatStore$.emojis.peek().length > 0 ||
          emoteData.twitchGlobalEmotes.length > 0 ||
          emoteData.twitchSubscriberEmotes.length > 0 ||
          emoteData.sevenTvGlobalEmotes.length > 0 ||
          emoteData.bttvGlobalEmotes.length > 0 ||
          emoteData.ffzGlobalEmotes.length > 0;

        if (!hasEmotes) {
          handleNewMessage(baseMessage, { countUnread });
          return;
        }

        const personalEmotes =
          userId && preferences.show7TvEmotes
            ? getUserPersonalEmotes(userId, channelId)
            : [];
        const currentUserLogin = normaliseChatUsername(user?.login);
        const senderLogin = normaliseChatUsername(
          userstate.login || userstate.username,
        );
        const twitchTaggedSubscriberEmotes = extractEmotesFromTag(
          userstate.emotes,
          text.trimEnd(),
        );
        const twitchSubscriberEmotes =
          senderLogin && senderLogin === currentUserLogin
            ? emoteData.twitchSubscriberEmotes
            : [];

        try {
          const replacedMessage = processEmotesWorklet({
            inputString: text.trimEnd(),
            userstate,
            emojiEmotes: chatStore$.emojis.peek(),
            sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
            sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
            sevenTvPersonalEmotes: personalEmotes,
            twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
            twitchChannelEmotes: emoteData.twitchChannelEmotes,
            twitchSubscriberEmotes: [
              ...twitchTaggedSubscriberEmotes,
              ...twitchSubscriberEmotes,
            ],
            ffzChannelEmotes: emoteData.ffzChannelEmotes,
            ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
            bttvChannelEmotes: emoteData.bttvChannelEmotes,
            bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
          });

          const cachedSharedBadgeContext =
            getCachedSharedChatBadgeContext(userstate);
          const badges = getMessageBadges({
            userstate,
            emoteData,
            sourceBadge: cachedSharedBadgeContext?.sourceBadge,
            sourceChannelBadges: cachedSharedBadgeContext?.sourceChannelBadges,
          });

          handleNewMessage(
            {
              ...baseMessage,
              message: replacedMessage,
              badges,
            },
            { countUnread },
          );

          if (cachedSharedBadgeContext?.isComplete === false) {
            void getSharedChatBadgeContext(userstate)
              .then(({ sourceBadge, sourceChannelBadges }) => {
                updateMessage(
                  baseMessage.message_id,
                  baseMessage.message_nonce,
                  {
                    badges: getMessageBadges({
                      userstate,
                      emoteData,
                      sourceBadge,
                      sourceChannelBadges,
                    }),
                  },
                );
              })
              .catch(error => {
                logger.chat.debug(
                  'Failed to update shared chat badges:',
                  error,
                );
              });
          }
        } catch (error) {
          logger.chat.error('Error processing emotes:', error);
          handleNewMessage(baseMessage, { countUnread });
        }
      },
      [channelId, handleNewMessage, preferences.show7TvEmotes, user?.login],
    );

    const reprocessVisibleMessageFromCache = useCallback(
      async (message: AnyChatMessageType) => {
        if (message.sender === 'System' || 'notice_tags' in message) {
          return;
        }

        const emoteData = getCurrentEmoteData(channelId);
        if (!emoteData) {
          return;
        }

        const text = replaceEmotesWithText(message.message).trimEnd();
        if (!text.trim()) {
          return;
        }

        const userId = message.userstate['user-id'];
        const personalEmotes =
          userId && preferences.show7TvEmotes
            ? getUserPersonalEmotes(userId, channelId)
            : [];
        const currentUserLogin = normaliseChatUsername(user?.login);
        const senderLogin = normaliseChatUsername(
          message.userstate.login || message.userstate.username,
        );
        const twitchTaggedSubscriberEmotes = extractEmotesFromTag(
          message.userstate.emotes,
          text,
        );
        const twitchSubscriberEmotes =
          senderLogin && senderLogin === currentUserLogin
            ? emoteData.twitchSubscriberEmotes
            : [];

        try {
          const replacedMessage = processEmotesWorklet({
            inputString: text,
            userstate: message.userstate,
            emojiEmotes: chatStore$.emojis.peek(),
            sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
            sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
            sevenTvPersonalEmotes: personalEmotes,
            twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
            twitchChannelEmotes: emoteData.twitchChannelEmotes,
            twitchSubscriberEmotes: [
              ...twitchTaggedSubscriberEmotes,
              ...twitchSubscriberEmotes,
            ],
            ffzChannelEmotes: emoteData.ffzChannelEmotes,
            ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
            bttvChannelEmotes: emoteData.bttvChannelEmotes,
            bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
          });

          const { sourceBadge, sourceChannelBadges } =
            await getSharedChatBadgeContext(message.userstate);
          const badges = getMessageBadges({
            userstate: message.userstate,
            emoteData,
            sourceBadge,
            sourceChannelBadges,
          });

          updateMessage(message.message_id, message.message_nonce, {
            message: replacedMessage,
            badges,
          });
        } catch (error) {
          logger.chat.debug('Failed to reprocess visible chat message:', error);
        }
      },
      [channelId, preferences.show7TvEmotes, user?.login],
    );

    const warmVisibleImages = useCallback(
      ({
        badgeUrls,
        emoteUrls,
      }: {
        badgeUrls: string[];
        emoteUrls: string[];
      }) => {
        const warm = (url: string, variant: 'badge' | 'emote') => {
          void cacheImageFromUrl(url, {
            priority: 'visible',
            variant,
          }).then(cachedUri => {
            if (cachedUri !== url) {
              void prefetchImage(cachedUri);
            }
          });
        };

        badgeUrls.forEach(url => warm(url, 'badge'));
        emoteUrls.forEach(url => warm(url, 'emote'));
      },
      [],
    );

    const handleViewableMessagesChange = useCallback(
      (visibleMessages: AnyChatMessageType[]) => {
        pendingVisibleMessagesRef.current = visibleMessages;
        if (visibleAssetHydrationTimerRef.current) {
          return;
        }

        visibleAssetHydrationTimerRef.current = setTimeout(() => {
          visibleAssetHydrationTimerRef.current = null;
          const messages = pendingVisibleMessagesRef.current;
          pendingVisibleMessagesRef.current = [];
          const shouldMaintainBottom = isAtBottomRef.current;

          void hydrateVisibleSevenTvAssets({
            channelId,
            messages,
            hydratedMessageKeys: hydratedVisibleAssetKeysRef.current,
            personalEmoteUsers: visiblePersonalEmoteUsersRef.current,
            cosmeticUsers: visibleCosmeticUsersRef.current,
            disableEmoteAnimations: preferences.disableEmoteAnimations,
            getUserPersonalEmotes,
            fetchUserPersonalEmotes,
            getUserBadge,
            fetchUserCosmetics,
            hydratePersonalEmotes: preferences.show7TvEmotes,
            hydrateCosmetics: preferences.show7tvBadges,
            warmVisibleImages,
            reprocessMessage: reprocessVisibleMessageFromCache,
          }).then(() => {
            if (shouldMaintainBottom && isAtBottomRef.current) {
              maintainBottomAfterContentChange();
            }
          });
        }, VISIBLE_ASSET_HYDRATION_DELAY_MS);
      },
      [
        channelId,
        fetchUserCosmetics,
        isAtBottomRef,
        maintainBottomAfterContentChange,
        preferences.disableEmoteAnimations,
        preferences.show7TvEmotes,
        preferences.show7tvBadges,
        reprocessVisibleMessageFromCache,
        warmVisibleImages,
      ],
    );

    const reprocessAllMessages = useCallback(() => {
      reprocessMessages(
        messages$.peek() as AnyChatMessageType[],
        processMessageEmotes,
      );
    }, [messages$, processMessageEmotes]);

    const handlePrivmsgMessage = useCallback(
      (tags: Record<string, string>, text: string, countUnread = true) => {
        const userstate = createUserStateFromTags(tags);
        const replyParentMessageId = tags['reply-parent-msg-id'];
        const replyParentDisplayName = tags['reply-parent-display-name'];

        const userId = tags['user-id'];

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

        processMessageEmotes(
          text,
          userstate,
          messageWithParentColor,
          userId,
          countUnread,
        );
      },
      [channelName, processMessageEmotes],
    );

    const onMessage = useCallback(
      (_channel: string, tags: Record<string, string>, text: string) => {
        handlePrivmsgMessage(tags, text);
      },
      [handlePrivmsgMessage],
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

        const isFullChatClear = !username;
        if (!isFullChatClear && username) {
          const moderationNotice =
            banDuration != null
              ? `Timed out (${banDuration}s)`
              : 'Permanently banned';

          moderateBufferedMessagesByLogin(username, moderationNotice);
          moderateMessagesByLogin(username, moderationNotice);
          return;
        }

        clearLocalMessages();

        const systemMessageText = 'Chat was cleared by a moderator';

        const systemMessage = createSystemMessage(
          channelName,
          systemMessageText,
        );

        batch(() => {
          clearMessages();
          addMessage(systemMessage as ChatMessageType<never>);
        });
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
        }, 0);
      },
      [
        clearLocalMessages,
        channelId,
        channelName,
        messages$,
        moderateBufferedMessagesByLogin,
      ],
    );

    const onClearMessage = useCallback(
      (_channel: string, tags: Record<string, string>, targetMsgId: string) => {
        logger.chat.warn('Twitch CLEARMSG received', {
          channelId,
          channelName,
          login: tags.login,
          roomId: tags['room-id'],
          targetMsgId,
        });

        const moderationNotice = 'Deleted';
        moderateBufferedMessageById(targetMsgId, moderationNotice);
        const existingMessage = getMessageById(targetMsgId);

        if (existingMessage) {
          moderateMessageById(targetMsgId, moderationNotice);
          return;
        }

        removeBufferedMessageById(targetMsgId);
        removeMessageById(targetMsgId);
      },
      [
        channelId,
        channelName,
        moderateBufferedMessageById,
        removeBufferedMessageById,
      ],
    );

    const onJoin = useCallback(() => {
      logger.chat.info('Joined channel:', channelName);
      appendSystemMessage(`Connected to ${channelName}'s room`);
    }, [appendSystemMessage, channelName]);

    const onPart = useCallback(() => {
      logger.chat.info('Parted from channel:', channelName);
      clearMessages();
      clearLocalMessages();
      roomStateRef.current = null;
    }, [channelName, clearLocalMessages]);

    const onNotice = useCallback(
      (_channel: string, tags: Record<string, string>, messageText: string) => {
        const noticeId = tags['msg-id'];

        if (noticeId && SUPPRESSED_NOTICE_IDS.has(noticeId)) {
          return;
        }

        const formattedNotice = formatNoticeMessage(tags, messageText);
        if (!formattedNotice) {
          return;
        }

        appendSystemMessage(formattedNotice);
      },
      [appendSystemMessage],
    );

    const onRoomState = useCallback(
      (_channel: string, tags: Record<string, string>) => {
        const nextState = parseRoomStateTags(tags);
        const previousState = roomStateRef.current;
        roomStateRef.current = nextState;

        if (!previousState) {
          const initialDescription = describeInitialRoomState(nextState);
          if (initialDescription) {
            appendSystemMessage(initialDescription);
          }
          return;
        }

        const changes = describeRoomStateChanges(previousState, nextState);
        changes.forEach(change => {
          appendSystemMessage(change);
        });
      },
      [appendSystemMessage],
    );

    const onReconnect = useCallback(() => {
      appendSystemMessage('Reconnecting to Twitch chat…');
      roomStateRef.current = null;
    }, [appendSystemMessage]);

    const handleRecentIrcMessage = useCallback(
      async (line: string) => {
        const ircMessage = parseIrcMessage(line);
        if (!ircMessage?.tags) {
          return;
        }

        const { command, params, tags } = ircMessage;
        const channel = params[0];
        if (!channel) {
          return;
        }

        switch (command) {
          case 'PRIVMSG': {
            const text = params[1];
            if (text) {
              handlePrivmsgMessage(tags, text, false);
            }
            break;
          }
          case 'USERNOTICE': {
            const text = params[1] ?? '';
            const message = createUserNoticeMessage({
              tags: tags as UserNoticeTags,
              channelName,
              text,
            });
            handleNewMessage(message, { countUnread: false });
            break;
          }
          case 'CLEARCHAT': {
            const username = params[1];
            const banDuration = tags['ban-duration']
              ? Number.parseInt(tags['ban-duration'], 10)
              : undefined;
            onClearChat(channel, tags, username, banDuration);
            break;
          }
          case 'CLEARMSG':
          case 'CLEARMESSAGE': {
            const targetMsgId = tags['target-msg-id'];
            if (targetMsgId) {
              onClearMessage(channel, tags, targetMsgId);
            }
            break;
          }
          case 'NOTICE': {
            const text = params[1];
            if (text) {
              onNotice(channel, tags, text);
            }
            break;
          }
          case 'ROOMSTATE': {
            onRoomState(channel, tags);
            break;
          }
        }
      },
      [
        channelName,
        handleNewMessage,
        handlePrivmsgMessage,
        onClearChat,
        onClearMessage,
        onNotice,
        onRoomState,
      ],
    );

    const {
      connectionState: twitchConnectionState,
      isConnected: isChatConnected,
      partChannel,
      joinChannel,
      sendMessage,
      sendChatCommand,
      getUserState,
    } = useTwitchChat({
      channel: channelName,
      onMessage,
      onNotice,
      onUserNotice,
      onClearChat,
      onClearMessage,
      onReconnect,
      onRoomState,
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

    const channelNameRef = useRef(channelName);
    channelNameRef.current = channelName;

    useEffect(() => {
      chatStore$.currentChannelId.set(channelId);
      const restoredCount = restoreRecentMessagesForChannel(channelId);
      if (restoredCount > 0) {
        scrollToBottom();
      }
    }, [channelId, scrollToBottom]);

    useEffect(() => {
      if (!showRecentMessages) {
        return;
      }

      const abortController = new AbortController();

      const loadRecentMessages = async () => {
        try {
          const recentMessages = await recentMessagesService.getRecentMessages(
            channelName,
            abortController.signal,
          );

          for (const message of recentMessages) {
            if (abortController.signal.aborted) {
              return;
            }
            // oxlint-disable-next-line no-await-in-loop -- Recent messages must replay in server order.
            await handleRecentIrcMessage(message);
          }

          forceFlush();
          scrollToBottom();
        } catch (error) {
          if (!abortController.signal.aborted) {
            logger.chat.debug('Failed to load recent messages:', error);
          }
        }
      };

      void loadRecentMessages();

      return () => {
        abortController.abort();
      };
    }, [
      channelName,
      forceFlush,
      handleRecentIrcMessage,
      scrollToBottom,
      showRecentMessages,
    ]);

    const refetchEmotesRef = useRef(refetchEmotes);
    refetchEmotesRef.current = refetchEmotes;

    const reprocessAllMessagesRef = useRef(reprocessAllMessages);
    reprocessAllMessagesRef.current = reprocessAllMessages;

    const partChannelRef = useRef(partChannel);
    partChannelRef.current = partChannel;

    const joinChannelRef = useRef(joinChannel);
    joinChannelRef.current = joinChannel;

    const preferencesUpdateRef = useRef(preferences.update);
    preferencesUpdateRef.current = preferences.update;

    const chatDensityRef = useRef(preferences.chatDensity);
    chatDensityRef.current = preferences.chatDensity;

    useEffect(() => {
      const fetchCurrentUserCosmetics = async () => {
        if (!user?.id) {
          return;
        }

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
      channelName,
      sevenTvEmoteSetId,
      canFetchCosmetics,
      fetchAndCacheUserCosmetics,
      updateSevenTvEmotes,
      onEmoteNotice: handleNewMessage,
    });

    const {
      subscribeToChannel,
      unsubscribeFromChannel,
      isConnected,
      readyState,
    } = useSeventvWs({
      ...sevenTvCallbacks,
      onEvent: eventType => logger.stvWs.debug(`SevenTV event: ${eventType}`),
    });
    const connected =
      twitchConnectionState === ReadyState.OPEN && isChatConnected();
    const wsConnected = readyState === ReadyState.OPEN && isConnected();

    useEffect(() => {
      if (!wsConnected || !channelId) {
        return;
      }

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
      if (!wsConnected || !channelId || emoteLoadStatus !== 'success') {
        return;
      }

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

    const handleReply = useCallback(
      (message: ChatMessageType<'usernotice'>) => {
        const messageText = replaceEmotesWithText(message.message);
        const parentMessage = getMessageById(message.message_id);

        const twitchUserId = message.userstate['user-id'];
        if (twitchUserId) {
          void fetchUserCosmetics(twitchUserId);
        }

        inputShellRef.current?.setReplyTo({
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
      [fetchUserCosmetics],
    );

    const handleEmoteSelect = useCallback((item: EmotePickerItem) => {
      const emoteName = typeof item === 'string' ? item : item.name;
      inputShellRef.current?.appendEmote(emoteName);
    }, []);

    const handleOpenEmoteSheet = useCallback(() => {
      overlayControllerRef.current?.openEmoteSheet();
    }, []);

    const handleOpenSettingsSheet = useCallback(() => {
      overlayControllerRef.current?.openSettingsSheet();
    }, []);

    const appendMentionToComposer = useCallback((username: string) => {
      inputShellRef.current?.appendMention(username);
    }, []);

    const hideUserFromView = useCallback((username?: string) => {
      if (!username) {
        return;
      }

      const normalised = username.trim().toLowerCase();
      setHiddenUsers(prev =>
        prev.includes(normalised) ? prev : [...prev, normalised].slice(-50),
      );
    }, []);

    const toggleHighlightedUser = useCallback((username?: string) => {
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

    const hidePhraseFromView = useCallback((phrase?: string) => {
      if (!phrase?.trim()) {
        return;
      }

      const normalised = phrase.trim().toLowerCase();
      setHiddenPhrases(prev =>
        prev.includes(normalised) ? prev : [...prev, normalised].slice(-50),
      );
    }, []);

    const handleClearFilters = useCallback(() => {
      setHiddenUsers([]);
      setHiddenPhrases([]);
      setHighlightedUsers([]);
      setShowOnlyMentions(false);
    }, []);

    const handleToggleShowOnlyMentions = useCallback(() => {
      setShowOnlyMentions(prev => !prev);
    }, []);

    const handleBadgeLongPress = useCallback((badge: BadgePressData) => {
      overlayControllerRef.current?.openBadge(badge);
    }, []);

    const handleMessageLongPress = useCallback(
      (data: MessageActionData<'usernotice'>) => {
        overlayControllerRef.current?.openMessageActions(data);
      },
      [],
    );

    const handleEmotePress = useCallback((emote: EmotePressData) => {
      overlayControllerRef.current?.openEmotePreview(emote);
    }, []);

    const handleUsernamePress = useCallback(
      (usernameData: UsernamePressData) => {
        overlayControllerRef.current?.openUserActions(usernameData);
      },
      [],
    );

    const canModerateChat = useMemo(() => {
      const currentUserState = getUserState();
      const parsedBadges = parseBadges(currentUserState['badges-raw']).badges;
      return (
        currentUserState.mod === '1' ||
        parsedBadges.broadcaster === '1' ||
        normaliseChatUsername(user?.login) ===
          normaliseChatUsername(channelName)
      );
    }, [channelName, getUserState, user?.login]);

    const {
      handlePinMessage,
      handlePinnedMessageChanged,
      handleRefreshPinnedMessage,
      handleUnpinPinnedMessage,
      pinnedMessage,
      pinnedMessageBusy,
      pinnedMessageId,
    } = usePinnedChatMessage({
      canModerateChat,
      channelId,
      moderatorId: user?.id,
    });

    const getMentionColor = useCallback((username: string): string => {
      const lowerUsername = username.toLowerCase();

      const cached = mentionColorCache.current.get(lowerUsername);
      if (cached) {
        return cached;
      }

      const color =
        getUserMessageColor(lowerUsername) ||
        generateRandomTwitchColor(username);
      const displayColor = lightenColor(color);

      mentionColorCache.current.set(lowerUsername, displayColor);

      return displayColor;
    }, []);

    const parseTextForEmotes = useCallback(
      (text: string): ParsedPart[] => {
        if (!text || !text.trim()) {
          return [];
        }

        const emoteData = getCurrentEmoteData(channelId);
        if (!emoteData) {
          return [{ type: 'text', content: text }];
        }

        const hasEmotes =
          chatStore$.emojis.peek().length > 0 ||
          emoteData.twitchGlobalEmotes.length > 0 ||
          emoteData.twitchSubscriberEmotes.length > 0 ||
          emoteData.sevenTvGlobalEmotes.length > 0 ||
          emoteData.bttvGlobalEmotes.length > 0 ||
          emoteData.ffzGlobalEmotes.length > 0;

        if (!hasEmotes) {
          return [{ type: 'text', content: text }];
        }

        return processEmotesWorklet({
          inputString: text.trimEnd(),
          userstate: null,
          emojiEmotes: chatStore$.emojis.peek(),
          sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
          sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
          twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
          twitchChannelEmotes: emoteData.twitchChannelEmotes,
          twitchSubscriberEmotes: emoteData.twitchSubscriberEmotes,
          ffzChannelEmotes: emoteData.ffzChannelEmotes,
          ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
          bttvChannelEmotes: emoteData.bttvChannelEmotes,
          bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
        });
      },
      [channelId],
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

    const handleDebugClearImageCache = useCallback(() => {
      void handleClearImageCache();
    }, [handleClearImageCache]);

    const handleResumeScrollToBottom = useCallback(() => {
      forceFlush();
      scrollToBottom();
    }, [forceFlush, scrollToBottom]);

    const handleSettingsRefetchEmotes = useCallback(() => {
      void refetchEmotesRef.current().then(() => {
        reprocessAllMessagesRef.current();
      });
    }, []);

    const handleSettingsReconnect = useCallback(() => {
      partChannelRef.current(channelNameRef.current);
      setTimeout(() => {
        joinChannelRef.current(channelNameRef.current);
      }, 1000);
    }, []);

    const handleToggleChatDensity = useCallback(() => {
      preferencesUpdateRef.current({
        chatDensity:
          chatDensityRef.current === 'compact' ? 'comfortable' : 'compact',
      });
    }, []);

    const handleToggleHighlightOwnMentions = useCallback((value: boolean) => {
      preferencesUpdateRef.current({ highlightOwnMentions: value });
    }, []);

    const handleToggleInlineReplyContext = useCallback((value: boolean) => {
      preferencesUpdateRef.current({ showInlineReplyContext: value });
    }, []);

    const handleToggleShowTimestamps = useCallback((value: boolean) => {
      preferencesUpdateRef.current({ chatTimestamps: value });
    }, []);

    const handleToggleShowUnreadJumpPill = useCallback((value: boolean) => {
      preferencesUpdateRef.current({ showUnreadJumpPill: value });
    }, []);

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
    const highlightedUserSet = useMemo(
      () =>
        new Set(highlightedUsers.map(normaliseChatUsername).filter(Boolean)),
      [highlightedUsers],
    );
    const currentUsernameForMentions = preferences.highlightOwnMentions
      ? (user?.login ?? user?.display_name)
      : undefined;
    const currentUsernameNormalized = useMemo(
      () => normaliseChatUsername(currentUsernameForMentions),
      [currentUsernameForMentions],
    );
    const messageListExtraData = useMemo(
      () => ({
        chatDensity: preferences.chatDensity,
        currentUsernameNormalized,
        disableEmoteAnimations: preferences.disableEmoteAnimations,
        highlightedReplyTargetMessageId,
        highlightedUsersKey: highlightedUsers.join('\u001f'),
        showInlineReplyContext: preferences.showInlineReplyContext,
        showTimestamps: preferences.chatTimestamps,
      }),
      [
        currentUsernameNormalized,
        highlightedReplyTargetMessageId,
        highlightedUsers,
        preferences.chatDensity,
        preferences.disableEmoteAnimations,
        preferences.showInlineReplyContext,
        preferences.chatTimestamps,
      ],
    );
    const listContentStyle = useMemo(() => styles.listContent, []);

    const handleReplyContextPress = useCallback(
      (replyParentMessageId: string) => {
        const messages = messages$.peek() as AnyChatMessageType[];
        const targetIndex = messages.findIndex(
          message => message.message_id === replyParentMessageId,
        );

        if (targetIndex < 0) {
          return;
        }

        void listRef.current?.scrollToIndex({
          animated: true,
          index: targetIndex,
          viewPosition: 0.35,
        });

        setHighlightedReplyTargetMessageId(replyParentMessageId);
        if (highlightedReplyTargetTimeoutRef.current) {
          clearTimeout(highlightedReplyTargetTimeoutRef.current);
        }
        highlightedReplyTargetTimeoutRef.current = setTimeout(() => {
          setHighlightedReplyTargetMessageId(current =>
            current === replyParentMessageId ? undefined : current,
          );
          highlightedReplyTargetTimeoutRef.current = null;
        }, 2200);
      },
      [messages$],
    );

    const renderItem = useCallback(
      // eslint-disable-next-line react/no-unused-prop-types
      ({ item: msg }: { item: AnyChatMessageType | undefined }) => {
        if (!isRenderableChatMessage(msg)) {
          return null;
        }

        return (
          <RichChatMessage
            id={msg.id}
            channel={msg.channel}
            message={msg.message}
            userstate={msg.userstate}
            badges={msg.badges}
            cachedSenderColor={msg.cachedSenderColor}
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
            isChannelPointRedemption={msg.isChannelPointRedemption}
            isTwitchSystemNotice={msg.isTwitchSystemNotice}
            currentUsername={currentUsernameForMentions}
            currentUsernameNormalized={currentUsernameNormalized}
            density={preferences.chatDensity}
            disableEmoteAnimations={preferences.disableEmoteAnimations}
            showTimestamp={preferences.chatTimestamps}
            highlightedUserSet={highlightedUserSet}
            showInlineReplyContext={preferences.showInlineReplyContext}
            onReplyContextPress={handleReplyContextPress}
            isHighlightedMessageTarget={
              msg.message_id === highlightedReplyTargetMessageId
            }
            // @ts-expect-error - notice_tags union type not narrowing correctly
            notice_tags={
              'notice_tags' in msg && msg.notice_tags
                ? msg.notice_tags
                : undefined
            }
          />
        );
      },
      [
        handleUsernamePress,
        handleReplyContextPress,
        currentUsernameForMentions,
        currentUsernameNormalized,
        preferences.chatDensity,
        preferences.disableEmoteAnimations,
        preferences.chatTimestamps,
        preferences.showInlineReplyContext,
        highlightedUserSet,
        highlightedReplyTargetMessageId,
      ],
    );

    const keyExtractor = useCallback(
      (item: AnyChatMessageType | undefined, index: number) =>
        isRenderableChatMessage(item)
          ? `${item.message_id}_${item.message_nonce}`
          : `invalid-message-${index}`,
      [],
    );

    const getItemType = useCallback((item: AnyChatMessageType | undefined) => {
      if (!isRenderableChatMessage(item)) {
        return 'invalid';
      }

      if (item.sender?.toLowerCase() === 'system') {
        return 'system-notice';
      }

      return item.isSpecialNotice ? 'notice' : 'regular';
    }, []);

    return (
      <View
        style={[
          styles.wrapper,
          transparent && styles.wrapperTransparent,
          applyTopInset && { paddingTop: insets.top },
        ]}
      >
        <ChatEmoteRuntime
          channelId={channelId}
          emoteLoadStatus={emoteLoadStatus}
          messages$={messages$}
          processedMessageIdsRef={processedMessageIdsRef}
          reprocessKey={chatAssetPreferenceKey}
        />
        <View style={styles.keyboardAvoidingView}>
          <View style={styles.chatContainer}>
            <ChatMessagePane
              canModerateChat={canModerateChat}
              channelId={channelId}
              channelName={channelName}
              connected={twitchConnectionState === ReadyState.OPEN}
              currentUsername={currentUsername}
              hiddenUsers={hiddenUsers}
              hiddenPhrases={hiddenPhrases}
              highlightedUsers={highlightedUsers}
              showOnlyMentions={showOnlyMentions}
              listRef={listRef}
              isAtBottomRef={isAtBottomRef}
              handleScroll={handleScroll}
              handleScrollBeginDrag={handleScrollBeginDrag}
              handleScrollEndDrag={handleScrollEndDrag}
              handleMomentumScrollEnd={handleMomentumScrollEnd}
              handleEndReached={handleEndReached}
              handleContentSizeChange={handleContentSizeChange}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              listContentStyle={listContentStyle}
              messageListExtraData={messageListExtraData}
              onClearFilters={handleClearFilters}
              onRefreshPinnedMessage={handleRefreshPinnedMessage}
              onToggleShowOnlyMentions={handleToggleShowOnlyMentions}
              onUnpinPinnedMessage={handleUnpinPinnedMessage}
              onViewableMessagesChange={handleViewableMessagesChange}
              pinnedMessage={pinnedMessage}
              pinnedMessageBusy={pinnedMessageBusy}
            />

            {preferences.showUnreadJumpPill &&
              !isAtBottom &&
              !isScrollingToBottom && (
                <ResumeScroll
                  unreadCount={unreadCount}
                  onScrollToBottom={handleResumeScrollToBottom}
                />
              )}
          </View>

          <KeyboardStickyView style={styles.inputStickyView}>
            <ChatInputShell
              ref={inputShellRef}
              canPinNextMessage={canModerateChat}
              channelId={channelId}
              channelName={channelName}
              connected={connected}
              getUserState={getUserState}
              isChatConnected={isChatConnected}
              onOpenEmoteSheet={handleOpenEmoteSheet}
              onOpenSettingsSheet={handleOpenSettingsSheet}
              onPinnedMessageChanged={handlePinnedMessageChanged}
              processMessageEmotes={processMessageEmotes}
              sendMessage={sendMessage}
              user={user}
            />
          </KeyboardStickyView>

          <ChatOverlayController
            ref={overlayControllerRef}
            canModerateChat={canModerateChat}
            channelId={channelId}
            channelName={channelName}
            connected={connected}
            disableEmoteAnimations={preferences.disableEmoteAnimations}
            emoteSheetRef={emoteSheetRef}
            handleReply={handleReply}
            highlightedUsers={highlightedUsers}
            hiddenUsers={hiddenUsers}
            hidePhraseFromView={hidePhraseFromView}
            hideUserFromView={hideUserFromView}
            appendMentionToComposer={appendMentionToComposer}
            onClearChatCache={handleClearChatCache}
            onClearImageCache={handleDebugClearImageCache}
            onInsertEmote={handleEmoteSelect}
            onPinMessage={handlePinMessage}
            onRefreshPinnedMessage={handleRefreshPinnedMessage}
            onSettingsReconnect={handleSettingsReconnect}
            onSettingsRefetchEmotes={handleSettingsRefetchEmotes}
            onToggleChatDensity={handleToggleChatDensity}
            onToggleHighlightOwnMentions={handleToggleHighlightOwnMentions}
            onToggleInlineReplyContext={handleToggleInlineReplyContext}
            onToggleShowTimestamps={handleToggleShowTimestamps}
            onToggleShowUnreadJumpPill={handleToggleShowUnreadJumpPill}
            onUnpinPinnedMessage={handleUnpinPinnedMessage}
            pinnedMessageBusy={pinnedMessageBusy}
            pinnedMessageId={pinnedMessageId}
            sendChatCommand={sendChatCommand}
            settingsSheetRef={settingsSheetRef}
            chatDensity={preferences.chatDensity}
            highlightOwnMentions={preferences.highlightOwnMentions}
            showInlineReplyContext={preferences.showInlineReplyContext}
            showTimestamps={preferences.chatTimestamps}
            showUnreadJumpPill={preferences.showUnreadJumpPill}
            toggleHighlightedUser={toggleHighlightedUser}
          />
        </View>
      </View>
    );
  },
);

Chat.displayName = 'Chat';

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  connectingContainer: {
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  connectingText: {
    color: theme.colorGrey,
    fontSize: theme.fontSize14,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginHorizontal: theme.space12,
    marginTop: theme.space12,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space20,
  },
  emptyStateBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    marginTop: theme.space8,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fontSize14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputStickyView: {
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: theme.space8,
    paddingTop: 0,
  },
  messagePane: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 0,
    paddingHorizontal: 16,
    paddingVertical: 1,
    width: '100%',
  },
  pinnedIconShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(145,91,255,0.28)',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pinnedMessageActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pinnedMessageActions: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  pinnedMessageBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(34,34,38,0.96)',
    borderBottomColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  pinnedMessageContent: {
    flex: 1,
    minWidth: 0,
  },
  pinnedMessageText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  pinnedMessageTitle: {
    color: '#ffffff',
    fontSize: theme.fontSize12,
    lineHeight: 16,
  },
  wrapper: {
    backgroundColor: '#222222',
    flex: 1,
  },
  wrapperTransparent: {
    backgroundColor: 'transparent',
  },
});

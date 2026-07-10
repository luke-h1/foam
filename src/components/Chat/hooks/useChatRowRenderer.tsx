import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { getUserMessageColor } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transientSelectors';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preferenceStore';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import type { ChatListRef } from '../components/ChatList';
import type { ChatListRenderItemInfo } from '../components/ChatList';
import {
  type BadgePressData,
  type EmotePressData,
  type MessageActionData,
  RichChatMessage,
  type UsernamePressData,
} from '../components/ChatMessage/RichChatMessage';
import {
  RowVisibilityContext,
  useRowVisibility,
} from '../components/ChatMessage/rowVisibility';
import { styles } from '../styles';
import type { ChatRowDisplayFlags } from '../types/chatUiFlags';
import {
  getChatMessageListKey,
  isRenderableChatMessage,
} from '../util/chatMessages';
import { getChatRowItemType } from '../util/chatRowItemType';
import { normaliseChatUsername } from '../util/chatUsernames';
import type { AnyChatMessageType } from '../util/messageHandlers';

const chatRowKeyExtractor = (item: AnyChatMessageType) =>
  getChatMessageListKey(item);

interface ChatRowPreferences {
  chatDensity: 'comfortable' | 'compact';
  chatFontScale?: ChatFontScale;
  chatTimestamps: boolean;
  customHighlights?: CustomHighlight[];
  disableEmoteAnimations: boolean;
  highlightOwnMentions?: boolean;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
}

interface UseChatRowRendererOptions {
  channelId: string;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  listRef: RefObject<ChatListRef | null>;
  messages$: { peek: () => AnyChatMessageType[] };
  onBadgePress: (badge: BadgePressData) => void;
  onEmotePress: (emote: EmotePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onUsernamePress: (data: UsernamePressData) => void;
  preferences: ChatRowPreferences;
  setHighlightedReplyTargetMessageId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  user?: {
    display_name?: string | null;
    login?: string | null;
  } | null;
}

interface ChatMessageRowProps {
  chatDensity: 'comfortable' | 'compact';
  channelId: string;
  currentUsername?: string;
  currentUsernameNormalized: string;
  customHighlights?: CustomHighlight[];
  displayFlags: ChatRowDisplayFlags;
  getMentionColor: (username: string) => string;
  highlightedUserSet: ReadonlySet<string>;
  index: number;
  message: AnyChatMessageType;
  onBadgePress: (badge: BadgePressData) => void;
  onEmotePress: (emote: EmotePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onReplyContextPress: (replyParentMessageId: string) => void;
  onUsernamePress: (data: UsernamePressData) => void;
  parseTextForEmotes: (text: string) => ParsedPart[];
}

const ChatMessageRow = function ChatMessageRow({
  chatDensity,
  channelId,
  currentUsername,
  currentUsernameNormalized,
  customHighlights,
  displayFlags,
  getMentionColor,
  highlightedUserSet,
  index,
  message: msg,
  onBadgePress,
  onEmotePress,
  onMessageLongPress,
  onReplyContextPress,
  onUsernamePress,
  parseTextForEmotes,
}: ChatMessageRowProps) {
  const {
    disableEmoteAnimations,
    fontScale,
    showAlternatingChatRows,
    showInlineReplyContext,
    showTimestamps,
  } = displayFlags;
  const isHighlightedMessageTarget = useIsHighlightedReplyTargetMessage(
    channelId,
    msg.message_id,
  );
  const rowVisibility = useRowVisibility();
  const isAlternatingRow = showAlternatingChatRows && index % 2 === 1;
  // Keep a stable identity for unchanged rows: a fresh object here would
  // defeat RichChatMessage's memo on every parent-driven re-render.
  const messageDisplay = useMemo(
    () => ({
      disableEmoteAnimations,
      isAlternatingRow,
      isChannelPointRedemption: msg.isChannelPointRedemption,
      isAnnouncement: msg.isAnnouncement,
      isHighlightedMessage: msg.isHighlightedMessage,
      isSharedChatDuplicated: msg.isSharedChatDuplicated,
      isHighlightedMessageTarget,
      isTwitchSystemNotice: msg.isTwitchSystemNotice,
      showInlineReplyContext,
      showTimestamp: showTimestamps,
    }),
    [
      disableEmoteAnimations,
      isAlternatingRow,
      isHighlightedMessageTarget,
      msg.isAnnouncement,
      msg.isChannelPointRedemption,
      msg.isHighlightedMessage,
      msg.isSharedChatDuplicated,
      msg.isTwitchSystemNotice,
      showInlineReplyContext,
      showTimestamps,
    ],
  );

  return (
    <RowVisibilityContext.Provider value={rowVisibility}>
      <RichChatMessage
        id={msg.id}
        broadcasterId={channelId}
        channel={msg.channel}
        message={msg.message}
        userstate={msg.userstate}
        badges={msg.badges}
        cachedSenderColor={
          msg.cachedSenderColor ??
          resolveCachedSenderColor(msg, getUserMessageColor)
        }
        message_id={msg.message_id}
        message_nonce={msg.message_nonce}
        sender={msg.sender}
        isAction={msg.isAction}
        style={styles.messageContainer}
        parentDisplayName={msg.parentDisplayName}
        parentColor={msg.parentColor}
        replyDisplayName={msg.replyDisplayName}
        replyBody={msg.replyBody}
        onBadgePress={onBadgePress}
        onMessageLongPress={onMessageLongPress}
        onEmotePress={onEmotePress}
        onUsernamePress={onUsernamePress}
        getMentionColor={getMentionColor}
        parseTextForEmotes={parseTextForEmotes}
        currentUsername={currentUsername}
        currentUsernameNormalized={currentUsernameNormalized}
        density={chatDensity}
        fontScale={fontScale}
        customHighlights={customHighlights}
        highlightedUserSet={highlightedUserSet}
        messageDisplay={messageDisplay}
        onReplyContextPress={onReplyContextPress}
        // @ts-expect-error - notice_tags union type not narrowing correctly
        notice_tags={
          'notice_tags' in msg && msg.notice_tags ? msg.notice_tags : undefined
        }
      />
    </RowVisibilityContext.Provider>
  );
};

export function useChatRowRenderer({
  channelId,
  highlightedReplyTargetTimeoutRef,
  highlightedUsers,
  listRef,
  messages$,
  onBadgePress,
  onEmotePress,
  onMessageLongPress,
  onUsernamePress,
  preferences,
  setHighlightedReplyTargetMessageId,
  user,
}: UseChatRowRendererOptions) {
  const getMentionColor = useCallback((username: string): string => {
    const cacheKey = username.replace(/^@/, '').trim().toLowerCase();
    const cached = getSessionCacheString('mentionColors', cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const displayColor = resolveMentionColor(username);
    setSessionCacheString('mentionColors', cacheKey, displayColor);

    return displayColor;
  }, []);

  const parseTextForEmotes = useCallback(
    (text: string): ParsedPart[] => {
      if (!text.trim()) {
        return [];
      }

      const emoteData = getCurrentEmoteData(channelId);
      if (!emoteData) {
        return [{ type: 'text', content: text }];
      }

      const hasEmotes =
        chatStore$.emojis.peek().length > 0 ||
        emoteData.twitchGlobalEmotes.length > 0 ||
        emoteData.twitchChannelEmotes.length > 0 ||
        emoteData.twitchSubscriberEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.sevenTvChannelEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.bttvChannelEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0 ||
        emoteData.ffzChannelEmotes.length > 0;

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

  const onBadgePressRef = useRef(onBadgePress);
  const onEmotePressRef = useRef(onEmotePress);
  const onMessageLongPressRef = useRef(onMessageLongPress);
  const onUsernamePressRef = useRef(onUsernamePress);
  const parseTextForEmotesRef = useRef(parseTextForEmotes);

  const highlightedUserSet = useMemo(
    () =>
      new Set(
        highlightedUsers.flatMap(user => {
          const normalized = normaliseChatUsername(user);
          return normalized ? [normalized] : [];
        }),
      ),
    [highlightedUsers],
  );
  const currentUsernameForMentions = preferences.highlightOwnMentions
    ? (user?.login ?? user?.display_name ?? undefined)
    : undefined;
  const currentUsernameNormalized = normaliseChatUsername(
    currentUsernameForMentions,
  );
  const displayFlags = useMemo(
    (): ChatRowDisplayFlags => ({
      disableEmoteAnimations: preferences.disableEmoteAnimations,
      fontScale: preferences.chatFontScale,
      showAlternatingChatRows: preferences.showAlternatingChatRows,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showTimestamps: preferences.chatTimestamps,
    }),
    [
      preferences.disableEmoteAnimations,
      preferences.chatFontScale,
      preferences.showAlternatingChatRows,
      preferences.showInlineReplyContext,
      preferences.chatTimestamps,
    ],
  );
  const customHighlights = preferences.customHighlights;
  const customHighlightsKey = useMemo(
    () =>
      (customHighlights ?? [])
        .map(rule => `${rule.phrase}:${rule.color}`)
        .join('|'),
    [customHighlights],
  );
  // Note: mentionLoginRevision is intentionally excluded. It bumps ~every 400ms
  // as @mention logins resolve from Helix; including it re-rendered every visible
  // row each time (the dominant frame-drop source in mention-heavy chat — busy
  // chat went from ~57fps to a flat 60fps once removed). Mention spans subscribe
  // to the revision themselves (MentionSpan), so only those spans re-render.
  const messageListExtraData = useMemo(
    () => ({
      chatDensity: preferences.chatDensity,
      chatFontScale: preferences.chatFontScale,
      currentUsernameNormalized,
      customHighlightsKey,
      disableEmoteAnimations: preferences.disableEmoteAnimations,
      highlightedUsersKey: highlightedUsers.join('\u001f'),
      showAlternatingChatRows: preferences.showAlternatingChatRows,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showTimestamps: preferences.chatTimestamps,
    }),
    [
      currentUsernameNormalized,
      customHighlightsKey,
      highlightedUsers,
      preferences.chatDensity,
      preferences.chatFontScale,
      preferences.disableEmoteAnimations,
      preferences.showAlternatingChatRows,
      preferences.showInlineReplyContext,
      preferences.chatTimestamps,
    ],
  );
  const listContentStyle = styles.listContent;

  const handleReplyContextPress = useCallback(
    (replyParentMessageId: string) => {
      const messages = messages$.peek();
      const targetIndex = messages.findIndex(
        message => message.message_id === replyParentMessageId,
      );

      if (targetIndex < 0) {
        return;
      }

      listRef.current?.scrollToIndex({
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
          current === replyParentMessageId ? null : current,
        );
        highlightedReplyTargetTimeoutRef.current = null;
      }, 2200);
    },
    [
      highlightedReplyTargetTimeoutRef,
      listRef,
      messages$,
      setHighlightedReplyTargetMessageId,
    ],
  );
  const handleReplyContextPressRef = useRef(handleReplyContextPress);

  useLayoutEffect(() => {
    onBadgePressRef.current = onBadgePress;
    onEmotePressRef.current = onEmotePress;
    onMessageLongPressRef.current = onMessageLongPress;
    onUsernamePressRef.current = onUsernamePress;
    parseTextForEmotesRef.current = parseTextForEmotes;
    handleReplyContextPressRef.current = handleReplyContextPress;
  });

  const getItemType = useCallback(
    (item: AnyChatMessageType) =>
      getChatRowItemType(item, {
        showInlineReplyContext: preferences.showInlineReplyContext,
      }),
    [preferences.showInlineReplyContext],
  );

  const renderItem = useCallback(
    ({ item: msg, index }: ChatListRenderItemInfo) => {
      if (!isRenderableChatMessage(msg)) {
        return null;
      }

      return (
        <ChatMessageRow
          chatDensity={preferences.chatDensity}
          channelId={channelId}
          currentUsername={currentUsernameForMentions}
          currentUsernameNormalized={currentUsernameNormalized}
          customHighlights={customHighlights}
          displayFlags={displayFlags}
          getMentionColor={getMentionColor}
          highlightedUserSet={highlightedUserSet}
          index={index}
          message={msg}
          onBadgePress={onBadgePressRef.current}
          onEmotePress={onEmotePressRef.current}
          onMessageLongPress={onMessageLongPressRef.current}
          onReplyContextPress={handleReplyContextPressRef.current}
          onUsernamePress={onUsernamePressRef.current}
          parseTextForEmotes={parseTextForEmotesRef.current}
        />
      );
    },
    [
      channelId,
      currentUsernameForMentions,
      currentUsernameNormalized,
      customHighlights,
      displayFlags,
      getMentionColor,
      highlightedUserSet,
      preferences.chatDensity,
    ],
  );

  const keyExtractor = useCallback(
    (item: AnyChatMessageType) => chatRowKeyExtractor(item),
    [],
  );

  return {
    getItemType,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    renderItem,
  };
}

import { useCallback, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useSyncRef } from '@app/hooks/useSyncRef';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { getUserMessageColor } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transientSelectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preferenceStore';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { getChatMessageListKey } from '@app/utils/chat/messageIdentity/getChatMessageListKey';
import { isRenderableChatMessage } from '@app/utils/chat/messageIdentity/isRenderableChatMessage';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor/resolveCachedSenderColor';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import type {
  ChatListRef,
  ChatListRenderItemInfo,
} from '../components/ChatList';
import { getChatTextStyles } from '../components/ChatMessage/chatText.styles';
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
import type { ChatRowDisplayFlags } from '../types/chatUiFlags';
import { chatEntranceSpring } from '../util/chatEntranceSpring';
import { shouldAnimateMessageEntrance } from '../util/chatMessages/shouldAnimateMessageEntrance';
import { getChatRowItemType } from '../util/chatRowItemType';
import { isUserNoticeTags } from '../util/richChatMessage/isUserNoticeTags';

const messageRowEntering = chatEntranceSpring(FadeInUp);

/**
 * A row renders an arbitrary message from the union, so its notice tags have
 * to be read through a guard rather than the generic - the variant is only
 * known at runtime.
 */
function getRowNoticeTags(
  message: AnyChatMessageType,
): UserNoticeTags | undefined {
  const tags = 'notice_tags' in message ? message.notice_tags : undefined;
  return isUserNoticeTags(tags) ? tags : undefined;
}

interface ChatRowPreferences {
  animate: boolean;
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
    animate,
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
  // Decided once at mount; a row must not replay its entrance on re-render.
  const [animateEntrance] = useState(
    () => animate && shouldAnimateMessageEntrance(msg, Date.now()),
  );
  const isAlternatingRow =
    showAlternatingChatRows && (msg.seq ?? index) % 2 === 1;
  const rowStyle = getChatTextStyles(fontScale, chatDensity === 'compact').row;

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

  const row = (
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
      timestamp={msg.timestamp}
      sender={msg.sender}
      isAction={msg.isAction}
      style={rowStyle}
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
      // RichChatMessage is generic over one notice variant; a row renders the
      // whole union, so TS collapses this prop to `undefined`. The value is
      // guarded above - widening the component's generic is the real fix.
      // @ts-expect-error - notice_tags cannot narrow against the row's union
      notice_tags={getRowNoticeTags(msg)}
    />
  );

  return (
    <RowVisibilityContext.Provider value={rowVisibility}>
      {animateEntrance ? (
        <Animated.View entering={messageRowEntering}>{row}</Animated.View>
      ) : (
        row
      )}
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
    const cacheKey = normaliseChatUsername(username);
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

  // Mirrored into refs so `renderItem` stays stable when a press handler's
  // identity changes; a new renderItem re-renders every visible row.
  const onBadgePressRef = useSyncRef(onBadgePress);
  const onEmotePressRef = useSyncRef(onEmotePress);
  const onMessageLongPressRef = useSyncRef(onMessageLongPress);
  const onUsernamePressRef = useSyncRef(onUsernamePress);
  const parseTextForEmotesRef = useSyncRef(parseTextForEmotes);

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
      animate: preferences.animate,
      disableEmoteAnimations: preferences.disableEmoteAnimations,
      fontScale: preferences.chatFontScale,
      showAlternatingChatRows: preferences.showAlternatingChatRows,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showTimestamps: preferences.chatTimestamps,
    }),
    [
      preferences.animate,
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
  /**
   * Content key, not array identity: the transient store can replace the array
   * with equal contents, and extraData identity re-renders every mounted row.
   */
  const highlightedUsersKey = useMemo(
    () => highlightedUsers.join('|'),
    [highlightedUsers],
  );
  /**
   * Spreads `displayFlags` rather than restating it: a flag added to the rows
   * but missed here would silently stop that preference from re-rendering them.
   */
  // Note: mentionLoginRevision is intentionally excluded. It bumps ~every 400ms
  // as @mention logins resolve from Helix; including it re-rendered every visible
  // row each time (the dominant frame-drop source in mention-heavy chat - busy
  // chat went from ~57fps to a flat 60fps once removed). Mention spans subscribe
  // to the revision themselves (MentionSpan), so only those spans re-render.
  const messageListExtraData = useMemo(
    () => ({
      ...displayFlags,
      chatDensity: preferences.chatDensity,
      currentUsernameNormalized,
      customHighlightsKey,
      highlightedUsersKey,
    }),
    [
      currentUsernameNormalized,
      customHighlightsKey,
      displayFlags,
      highlightedUsersKey,
      preferences.chatDensity,
    ],
  );
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
  const handleReplyContextPressRef = useSyncRef(handleReplyContextPress);

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
    // The *Ref entries are stable ref objects from useSyncRef; they are listed
    // only because the rule cannot see through the custom hook. Reading
    // `.current` here is the point — it keeps renderItem stable when a handler
    // changes identity, which would otherwise re-render every visible row.
    [
      channelId,
      currentUsernameForMentions,
      currentUsernameNormalized,
      customHighlights,
      displayFlags,
      getMentionColor,
      handleReplyContextPressRef,
      highlightedUserSet,
      onBadgePressRef,
      onEmotePressRef,
      onMessageLongPressRef,
      onUsernamePressRef,
      parseTextForEmotesRef,
      preferences.chatDensity,
    ],
  );

  return {
    getItemType,
    keyExtractor: getChatMessageListKey,
    messageListExtraData,
    renderItem,
  };
}

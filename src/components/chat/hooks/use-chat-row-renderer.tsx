import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chat-color-caches';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { processEmotesWorklet } from '@app/utils/chat/emote-processor';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/get-chat-message-list-key';
import { isRenderableChatMessage } from '@app/utils/chat/message-identity/is-renderable-chat-message';
import type { MessageToken } from '@app/utils/chat/message-token';
import { resolveMentionColor } from '@app/utils/chat/resolve-mention-color';

import type {
  ChatListRef,
  ChatListRenderItemInfo,
} from '../components/chat-list';
import {
  type BadgePressData,
  type EmotePressData,
  type MessageActionData,
  type UsernamePressData,
} from '../components/chat-message/chat-row';
import {
  ChatRowItem,
  type ChatRowPreferences,
} from '../components/chat-message/chat-row-item';
import type { ChatRowDisplayFlags } from '../types/chat-ui-flags';
import { getChatRowItemType } from '../util/chat-row-item-type';

interface UseChatRowRendererOptions {
  channelId: string;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  listRef: RefObject<ChatListRef | null>;
  messages$: { peek: () => AnyChatMessageType[] };
  noteScrollAwayIntent: () => void;
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

export function useChatRowRenderer({
  channelId,
  highlightedReplyTargetTimeoutRef,
  highlightedUsers,
  listRef,
  messages$,
  noteScrollAwayIntent,
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
    (text: string): MessageToken[] => {
      if (!text.trim()) {
        return [];
      }

      const emoteData = getCurrentEmoteData(channelId);

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

  const highlightedUsersKey = useMemo(
    () => highlightedUsers.join('|'),
    [highlightedUsers],
  );

  /**
   * Spreads `displayFlags` rather than restating it: a flag missed here would
   * silently stop that preference from re-rendering the rows.
   */
  // mentionLoginRevision is deliberately excluded: it bumps ~every 400ms and
  // re-rendered every visible row (~57fps -> 60fps once removed); MentionToken subscribes itself.
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

      const targetMessage = messages.find(
        message => message.message_id === replyParentMessageId,
      );

      if (!targetMessage) {
        return;
      }

      noteScrollAwayIntent();

      void listRef.current?.scrollToItem({
        animated: true,
        item: targetMessage,
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
      noteScrollAwayIntent,
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
        <ChatRowItem
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
    // The *Ref entries are stable useSyncRef objects, listed only because the
    // rule cannot see through the hook. Reading `.current` keeps renderItem
    // stable when a handler changes identity.
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

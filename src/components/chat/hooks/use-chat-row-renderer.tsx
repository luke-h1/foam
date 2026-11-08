import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';

import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chat-color-caches';
import { hasEnrichmentEmoteSources } from '@app/store/chat/actions/message-enrichment';
import { resolveMessageEmoteTokens } from '@app/store/chat/actions/resolveMessageEmoteTokens';
import type {
  BadgePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/getChatMessageListKey';
import { isRenderableChatMessage } from '@app/utils/chat/message-identity/isRenderableChatMessage';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';

import {
  ChatRowItem,
  type ChatRowPreferences,
} from '../components/chat-message/ChatRowItem';
import type {
  ChatListRef,
  ChatListRenderItemInfo,
} from '../components/ChatList';
import type { ChatRowDisplayFlags } from '../types/chat-ui-flags';
import { getChatRowItemType } from '../util/chatRowItemType';

interface UseChatRowRendererOptions {
  channelId: string;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  listRef: RefObject<ChatListRef | null>;
  messages$: ChatMessagesSource;
  noteScrollAwayIntent: () => void;
  onBadgePress: (badge: BadgePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onUsernamePress: (data: UsernamePressData) => void;
  preferences: ChatRowPreferences;
  setHighlightedReplyTargetMessageId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  user?:
    | {
        display_name?: string | null;
        login?: string | null;
      }
    | null
    | undefined;
}

const REFERENCED_TEXT_USERSTATE: UserStateTags = {
  'reply-parent-display-name': '',
  'reply-parent-msg-body': '',
  'reply-parent-msg-id': '',
  'reply-parent-user-login': '',
};

export function useChatRowRenderer({
  channelId,
  highlightedReplyTargetTimeoutRef,
  highlightedUsers,
  listRef,
  messages$,
  noteScrollAwayIntent,
  onBadgePress,
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

      if (!hasEnrichmentEmoteSources(emoteData)) {
        return [{ type: 'text', content: text }];
      }

      return resolveMessageEmoteTokens({
        channelId,
        emoteData,
        show7TvEmotes: false,
        text: text.trimEnd(),
        userstate: REFERENCED_TEXT_USERSTATE,
      });
    },
    [channelId],
  );

  const onBadgePressRef = useSyncRef(onBadgePress);

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
      customHighlights.map(rule => `${rule.phrase}:${rule.color}`).join('|'),
    [customHighlights],
  );

  const highlightedUsersKey = useMemo(
    () => highlightedUsers.join('|'),
    [highlightedUsers],
  );

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
          {...{
            chatDensity: preferences.chatDensity,
            channelId,
            currentUsername: currentUsernameForMentions,
            currentUsernameNormalized,
            customHighlights,
            displayFlags,
            getMentionColor,
            highlightedUserSet,
            index,
            message: msg,
            onBadgePress: onBadgePressRef.current,
            onMessageLongPress: onMessageLongPressRef.current,
            onReplyContextPress: handleReplyContextPressRef.current,
            onUsernamePress: onUsernamePressRef.current,
            parseTextForEmotes: parseTextForEmotesRef.current,
          }}
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
      handleReplyContextPressRef,
      highlightedUserSet,
      onBadgePressRef,
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

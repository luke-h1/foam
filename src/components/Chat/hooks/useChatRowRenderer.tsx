import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { getUserMessageColor } from '@app/store/chat/actions/messages';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chatColorCaches';
import { useChatRowPreferences } from '@app/store/preferences';
import { useSelector } from '@legendapp/state/react';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { resolveCachedSenderColor } from '@app/utils/chat/resolveCachedSenderColor';
import { resolveMentionColor } from '@app/utils/chat/resolveMentionColor';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import type { RefObject } from 'react';

import type { ChatListRef, ChatListRenderItemInfo } from '../ChatMessagePane';
import {
  RichChatMessage,
  type EmotePressData,
  type MessageActionData,
  type UsernamePressData,
} from '../ChatMessage/RichChatMessage';
import { styles } from '../styles';
import {
  getChatMessageListKey,
  isRenderableChatMessage,
} from '../util/chatMessages';
import { getChatRowItemType } from '../util/chatRowItemType';
import { normaliseChatUsername } from '../util/normaliseChatUsername';
import type { AnyChatMessageType } from '../util/messageHandlers';
import type { ChatRowDisplayFlags } from '../types/chatUiFlags';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transientState';

const chatRowKeyExtractor = (item: AnyChatMessageType) =>
  getChatMessageListKey(item);

interface UseChatRowRendererOptions {
  channelId: string;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  listRef: RefObject<ChatListRef | null>;
  messages$: { peek: () => AnyChatMessageType[] };
  onEmotePress: (emote: EmotePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onUsernamePress: (data: UsernamePressData) => void;
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
  displayFlags: ChatRowDisplayFlags;
  getMentionColor: (username: string) => string;
  highlightedUserSet: ReadonlySet<string>;
  index: number;
  message: AnyChatMessageType;
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
  displayFlags,
  getMentionColor,
  highlightedUserSet,
  index,
  message: msg,
  onEmotePress,
  onMessageLongPress,
  onReplyContextPress,
  onUsernamePress,
  parseTextForEmotes,
}: ChatMessageRowProps) {
  const {
    disableEmoteAnimations,
    showAlternatingChatRows,
    showInlineReplyContext,
    showTimestamps,
  } = displayFlags;
  const isHighlightedMessageTarget = useIsHighlightedReplyTargetMessage(
    channelId,
    msg.message_id,
  );

  return (
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
      style={styles.messageContainer}
      parentDisplayName={msg.parentDisplayName}
      parentColor={msg.parentColor}
      replyDisplayName={msg.replyDisplayName}
      replyBody={msg.replyBody}
      onMessageLongPress={onMessageLongPress}
      onEmotePress={onEmotePress}
      onUsernamePress={onUsernamePress}
      getMentionColor={getMentionColor}
      parseTextForEmotes={parseTextForEmotes}
      currentUsername={currentUsername}
      currentUsernameNormalized={currentUsernameNormalized}
      density={chatDensity}
      highlightedUserSet={highlightedUserSet}
      messageDisplay={{
        disableEmoteAnimations,
        isAlternatingRow: showAlternatingChatRows && index % 2 === 1,
        isChannelPointRedemption: msg.isChannelPointRedemption,
        isAnnouncement: msg.isAnnouncement,
        isHighlightedMessage: msg.isHighlightedMessage,
        isSharedChatDuplicated: msg.isSharedChatDuplicated,
        isHighlightedMessageTarget,
        isTwitchSystemNotice: msg.isTwitchSystemNotice,
        showInlineReplyContext,
        showTimestamp: showTimestamps,
      }}
      onReplyContextPress={onReplyContextPress}
      // @ts-expect-error - notice_tags union type not narrowing correctly
      notice_tags={
        'notice_tags' in msg && msg.notice_tags ? msg.notice_tags : undefined
      }
    />
  );
};

export function useChatRowRenderer({
  channelId,
  highlightedReplyTargetTimeoutRef,
  highlightedUsers,
  listRef,
  messages$,
  onEmotePress,
  onMessageLongPress,
  onUsernamePress,
  setHighlightedReplyTargetMessageId,
  user,
}: UseChatRowRendererOptions) {
  const mentionLoginRevision = useSelector(chatStore$.mentionLoginRevision);
  const preferences = useChatRowPreferences();

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

  const parseTextForEmotes = (text: string): ParsedPart[] => {
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
  };

  const onEmotePressRef = useRef(onEmotePress);
  const onMessageLongPressRef = useRef(onMessageLongPress);
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
      showAlternatingChatRows: preferences.showAlternatingChatRows,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showTimestamps: preferences.chatTimestamps,
    }),
    [
      preferences.disableEmoteAnimations,
      preferences.showAlternatingChatRows,
      preferences.showInlineReplyContext,
      preferences.chatTimestamps,
    ],
  );
  const messageListExtraData = useMemo(
    () => ({
      chatDensity: preferences.chatDensity,
      currentUsernameNormalized,
      disableEmoteAnimations: preferences.disableEmoteAnimations,
      highlightedUsersKey: highlightedUsers.join('\u001f'),
      mentionLoginRevision,
      showAlternatingChatRows: preferences.showAlternatingChatRows,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showTimestamps: preferences.chatTimestamps,
    }),
    [
      currentUsernameNormalized,
      highlightedUsers,
      mentionLoginRevision,
      preferences.chatDensity,
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
    onEmotePressRef.current = onEmotePress;
    onMessageLongPressRef.current = onMessageLongPress;
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
          displayFlags={displayFlags}
          getMentionColor={getMentionColor}
          highlightedUserSet={highlightedUserSet}
          index={index}
          message={msg}
          onEmotePress={onEmotePressRef.current}
          onMessageLongPress={onMessageLongPressRef.current}
          onReplyContextPress={handleReplyContextPressRef.current}
          onUsernamePress={onUsernamePress}
          parseTextForEmotes={parseTextForEmotesRef.current}
        />
      );
    },
    [
      channelId,
      currentUsernameForMentions,
      currentUsernameNormalized,
      displayFlags,
      getMentionColor,
      highlightedUserSet,
      onUsernamePress,
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

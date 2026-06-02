import { chatStore$ } from '@app/store/chatStore/state';
import { getCurrentEmoteData } from '@app/store/chatStore/channelLoad';
import { getUserMessageColor } from '@app/store/chatStore/messages';
import { processEmotesOnChatRuntimeSync } from '@app/utils/chat/emoteProcessor';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';

import type { ChatListRef } from '../components/ChatList';
import {
  RichChatMessage,
  type BadgePressData,
  type EmotePressData,
  type MessageActionData,
  type UsernamePressData,
} from '../components/ChatMessage/RichChatMessage';
import { styles } from '../styles';
import { isRenderableChatMessage } from '../util/chatMessages';
import { normaliseChatUsername } from '../util/chatUsernames';
import type { AnyChatMessageType } from '../util/messageHandlers';

interface ChatRowPreferences {
  chatDensity: 'comfortable' | 'compact';
  chatTimestamps: boolean;
  disableEmoteAnimations: boolean;
  highlightOwnMentions?: boolean;
  showInlineReplyContext: boolean;
}

interface UseChatRowRendererOptions {
  channelId: string;
  highlightedReplyTargetMessageId?: string;
  highlightedReplyTargetTimeoutRef: RefObject<ReturnType<
    typeof setTimeout
  > | null>;
  highlightedUsers: string[];
  listRef: RefObject<ChatListRef | null>;
  messages$: { peek: () => unknown[] };
  onBadgePress: (badge: BadgePressData) => void;
  onEmotePress: (emote: EmotePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onUsernamePress: (data: UsernamePressData) => void;
  preferences: ChatRowPreferences;
  setHighlightedReplyTargetMessageId: Dispatch<
    SetStateAction<string | undefined>
  >;
  user?: {
    display_name?: string | null;
    login?: string | null;
  } | null;
}

export function useChatRowRenderer({
  channelId,
  highlightedReplyTargetMessageId,
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
  const mentionColorCache = useRef<Map<string, string>>(new Map());

  const getMentionColor = useCallback((username: string): string => {
    const lowerUsername = username.toLowerCase();
    const cached = mentionColorCache.current.get(lowerUsername);
    if (cached) {
      return cached;
    }

    const color =
      getUserMessageColor(lowerUsername) || generateRandomTwitchColor(username);
    const displayColor = lightenColor(color);
    mentionColorCache.current.set(lowerUsername, displayColor);

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
        emoteData.twitchSubscriberEmotes.length > 0 ||
        emoteData.sevenTvGlobalEmotes.length > 0 ||
        emoteData.bttvGlobalEmotes.length > 0 ||
        emoteData.ffzGlobalEmotes.length > 0;

      if (!hasEmotes) {
        return [{ type: 'text', content: text }];
      }

      return processEmotesOnChatRuntimeSync({
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
  const getMentionColorRef = useRef(getMentionColor);
  const parseTextForEmotesRef = useRef(parseTextForEmotes);
  onBadgePressRef.current = onBadgePress;
  onEmotePressRef.current = onEmotePress;
  onMessageLongPressRef.current = onMessageLongPress;
  getMentionColorRef.current = getMentionColor;
  parseTextForEmotesRef.current = parseTextForEmotes;

  const highlightedUserSet = useMemo(
    () => new Set(highlightedUsers.map(normaliseChatUsername).filter(Boolean)),
    [highlightedUsers],
  );
  const currentUsernameForMentions = preferences.highlightOwnMentions
    ? (user?.login ?? user?.display_name ?? undefined)
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
          current === replyParentMessageId ? undefined : current,
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

  const renderItem = useCallback(
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
          onBadgePress={onBadgePressRef.current}
          onMessageLongPress={onMessageLongPressRef.current}
          onEmotePress={onEmotePressRef.current}
          onUsernamePress={onUsernamePress}
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
      currentUsernameForMentions,
      currentUsernameNormalized,
      handleReplyContextPress,
      highlightedReplyTargetMessageId,
      highlightedUserSet,
      getMentionColorRef,
      onBadgePressRef,
      onEmotePressRef,
      onMessageLongPressRef,
      onUsernamePress,
      parseTextForEmotesRef,
      preferences.chatDensity,
      preferences.chatTimestamps,
      preferences.disableEmoteAnimations,
      preferences.showInlineReplyContext,
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

  return {
    getItemType,
    keyExtractor,
    listContentStyle,
    messageListExtraData,
    renderItem,
  };
}

import { useMemo, useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ChatRowDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import { shouldAnimateMessageEntrance } from '@app/components/chat/util/chat-messages/shouldAnimateMessageEntrance';
import { isUserNoticeTags } from '@app/components/chat/util/chat-row/isUserNoticeTags';
import { chatEntranceSpring } from '@app/components/chat/util/chatEntranceSpring';
import { getUserMessageColor } from '@app/store/chat/actions/message-color-index';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transient-selectors';
import type {
  BadgePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { CustomHighlight } from '@app/types/chat/customHighlight';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getChatMessageStoreId } from '@app/utils/chat/message-identity/getChatMessageStoreId';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolveCachedSenderColor';

import { ChatRow } from './ChatRow';
import { getChatTextStyles } from './ChatText.styles';
import { RowVisibilityContext, useRowVisibility } from './util/rowVisibility';

const messageRowEntering = chatEntranceSpring(FadeInUp);

/**
 * A row renders the whole message union, so notice tags go through a runtime
 * guard rather than the generic.
 */
function getRowNoticeTags(
  message: AnyChatMessageType,
): UserNoticeTags | undefined {
  const tags = 'notice_tags' in message ? message.notice_tags : undefined;
  return isUserNoticeTags(tags) ? tags : undefined;
}

export interface ChatRowPreferences {
  animate: boolean;
  chatDensity: ChatDensity;
  chatFontScale?: ChatFontScale;
  chatTimestamps: boolean;
  customHighlights: CustomHighlight[];
  disableEmoteAnimations: boolean;
  highlightOwnMentions?: boolean;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
}

interface ChatMessageRowProps {
  chatDensity: ChatDensity;
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
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onReplyContextPress: (replyParentMessageId: string) => void;
  onUsernamePress: (data: UsernamePressData) => void;
  parseTextForEmotes: (text: string) => MessageToken[];
}

export const ChatRowItem = function ChatRowItem({
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

  const messageKey = getChatMessageStoreId(msg);

  // Per message, not once at mount: a recycled row must still play a live
  // message's entrance. Recency guard skips scrollback; key re-fires entering.
  const [entrance, setEntrance] = useState(() => ({
    key: messageKey,
    play: animate && shouldAnimateMessageEntrance(msg, Date.now()),
  }));

  if (entrance.key !== messageKey) {
    setEntrance({
      key: messageKey,
      play: animate && shouldAnimateMessageEntrance(msg, Date.now()),
    });
  }

  const isAlternatingRow =
    showAlternatingChatRows && (msg.seq ?? index) % 2 === 1;

  const rowStyle = getChatTextStyles(fontScale, chatDensity).row;

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
    <ChatRow
      {...msg}
      broadcasterId={channelId}
      cachedSenderColor={
        msg.cachedSenderColor ??
        resolveCachedSenderColor(msg, getUserMessageColor)
      }
      currentUsername={currentUsername}
      currentUsernameNormalized={currentUsernameNormalized}
      customHighlights={customHighlights}
      density={chatDensity}
      fontScale={fontScale}
      getMentionColor={getMentionColor}
      highlightedUserSet={highlightedUserSet}
      messageDisplay={messageDisplay}
      onBadgePress={onBadgePress}
      onMessageLongPress={onMessageLongPress}
      onReplyContextPress={onReplyContextPress}
      onUsernamePress={onUsernamePress}
      parseTextForEmotes={parseTextForEmotes}
      style={rowStyle}
      // @ts-expect-error - ChatRow is generic over one notice variant, so the row's union types this prop as `undefined`. getRowNoticeTags guards the value.
      notice_tags={getRowNoticeTags(msg)}
    />
  );

  return (
    <RowVisibilityContext.Provider value={rowVisibility}>
      {entrance.play ? (
        <Animated.View key={messageKey} entering={messageRowEntering}>
          {row}
        </Animated.View>
      ) : (
        row
      )}
    </RowVisibilityContext.Provider>
  );
};

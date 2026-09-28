import { useMemo, useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { ChatRowDisplayFlags } from '@app/components/chat/types/chat-ui-flags';
import { chatEntranceSpring } from '@app/components/chat/util/chat-entrance-spring';
import { shouldAnimateMessageEntrance } from '@app/components/chat/util/chat-messages/should-animate-message-entrance';
import { isUserNoticeTags } from '@app/components/chat/util/chat-row/is-user-notice-tags';
import { getUserMessageColor } from '@app/store/chat/actions/messages';
import { useIsHighlightedReplyTargetMessage } from '@app/store/chat/react/transient-selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type {
  ChatFontScale,
  CustomHighlight,
} from '@app/store/preference-store';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/utils/chat/message-token';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolve-cached-sender-color';

import {
  type BadgePressData,
  ChatRow,
  type EmotePressData,
  type MessageActionData,
  type UsernamePressData,
} from './chat-row';
import { getChatTextStyles } from './chat-text.styles';
import { RowVisibilityContext, useRowVisibility } from './util/row-visibility';

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
  chatDensity: 'comfortable' | 'compact';
  chatFontScale?: ChatFontScale;
  chatTimestamps: boolean;
  customHighlights?: CustomHighlight[];
  disableEmoteAnimations: boolean;
  highlightOwnMentions?: boolean;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
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
    <ChatRow
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
      // ChatRow is generic over one notice variant; the row's union collapses this prop to `undefined`. Value guarded above.
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

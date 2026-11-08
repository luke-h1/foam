import type { RefObject } from 'react';

import type { ChatListRef } from '@app/components/chat/components/ChatList';
import type { ChatMessagesSource } from '@app/components/chat/types/chat-messages-source';
import { formatModerationSystemMessage } from '@app/components/chat/util/format-moderation-system-message/formatModerationSystemMessage';
import { formatNoticeMessage } from '@app/components/chat/util/formatNoticeMessage';
import { isSameIrcChannel } from '@app/components/chat/util/irc-client/formatIrcCommand';
import type {
  RoomStateTracker,
  RoomStateUpdate,
} from '@app/components/chat/util/room-state/roomStateTracker';
import { SUPPRESSED_NOTICE_IDS } from '@app/components/chat/util/room-state/suppressedNoticeIds';
import { resetChannelSession } from '@app/store/chat/actions/channel-session';
import {
  enrichChannelPointPrivmsgTags,
  ingestChannelPointRewardTags,
  registerDeferredRewardgiftStandalone,
} from '@app/store/chat/actions/channelPointRewardTitleStore';
import { getMessageColor } from '@app/store/chat/actions/message-color-index';
import {
  addMessage,
  clearMessagesWithNotice,
} from '@app/store/chat/actions/messages';
import { getPreferences } from '@app/store/preference-store';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/reportUnrenderableNotice';
import { getFallbackSenderColor } from '@app/utils/chat/getFallbackSenderColor';
import { parseIrcMessage } from '@app/utils/chat/irc-protocol/parseIrcMessage';
import {
  type IrcRouteHandlers,
  routeIrcMessage,
} from '@app/utils/chat/irc-protocol/routeIrcMessage';
import { createBaseMessage } from '@app/utils/chat/message-handlers/createBaseMessage';
import { createSystemMessage } from '@app/utils/chat/message-handlers/createSystemMessage';
import { createUserNoticeMessage } from '@app/utils/chat/message-handlers/createUserNoticeMessage';
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/createUserStateFromTags';
import { parseActionMessage } from '@app/utils/chat/parse-action-message/parseActionMessage';
import { logger } from '@app/utils/logger';

const LIVE_FLAG = {};
const HISTORICAL_FLAG = { isHistorical: true as const };

const historicalFlag = (countUnread: boolean) =>
  countUnread ? LIVE_FLAG : HISTORICAL_FLAG;

export interface ChatIrcHandlerDeps {
  channelId: string;
  channelName: string;
  clearLocalMessages: () => void;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  isMountedRef?: RefObject<boolean>;
  listRef: RefObject<ChatListRef | null>;
  isLoadingRecentMessagesRef?: RefObject<boolean>;
  messages$: ChatMessagesSource;
  moderateChatMessageById: (messageId: string, notice: string) => void;
  moderateChatMessagesByLogin: (login: string, notice: string) => void;
  removeChatMessagesByLogin: (login: string) => void;
  enqueueLiveChatMessage: (
    baseMessage: AnyChatMessageType,
    countUnread?: boolean,
  ) => void;
  processMessageEmotes: (
    text: string,
    userstate: ReturnType<typeof createUserStateFromTags>,
    baseMessage: AnyChatMessageType,
    userId?: string,
    countUnread?: boolean,
  ) => void;
  removeChatMessageById: (messageId: string) => void;
  roomStateTracker: RoomStateTracker;
}

export function createChatIrcHandlers({
  channelId,
  channelName,
  clearLocalMessages,
  enqueueLiveChatMessage,
  handleNewMessage,
  isMountedRef,
  isLoadingRecentMessagesRef,
  listRef,
  messages$,
  moderateChatMessageById,
  moderateChatMessagesByLogin,
  processMessageEmotes,
  removeChatMessageById,
  removeChatMessagesByLogin,
  roomStateTracker,
}: ChatIrcHandlerDeps) {
  const appendSystemMessage = (content: string) => {
    addMessage(
      createSystemMessage(
        channelName,
        content,
        getPreferences().chatTimestampFormat,
      ),
    );
  };

  const applyRoomStateUpdate = (update: RoomStateUpdate) => {
    update.notices.forEach(notice => {
      appendSystemMessage(notice);
    });
  };

  const handlePrivmsgMessage = (
    tags: Record<string, string>,
    rawText: string,
    countUnread = true,
  ) => {
    const { isAction, text } = parseActionMessage(rawText);
    const replyParentMessageId = tags['reply-parent-msg-id'];
    const replyParentDisplayName = tags['reply-parent-display-name'];

    // The parent's own colour is only known once its message is in the store;
    // otherwise fall back to the same hash Twitch uses for an unset colour.
    const parentColor = replyParentDisplayName?.trim()
      ? getMessageColor(replyParentMessageId ?? '') ||
        getFallbackSenderColor(replyParentDisplayName)
      : undefined;

    const baseMessage = createBaseMessage({
      tags: enrichChannelPointPrivmsgTags(tags, channelId),
      channelName,
      text,
      isAction,
      timestampFormat: getPreferences().chatTimestampFormat,
    });

    const messageWithParentColor = {
      ...baseMessage,
      parentColor,
      ...historicalFlag(countUnread),
    };

    enqueueLiveChatMessage(messageWithParentColor, countUnread);
  };

  const onMessage = (
    _channel: string,
    tags: Record<string, string>,
    text: string,
  ) => {
    handlePrivmsgMessage(tags, text);
  };

  const handleUserNoticeMessage = (
    tags: UserNoticeTags,
    text: string,
    countUnread = true,
  ) => {
    const isRewardgift = tags['msg-id'] === 'rewardgift';
    const isBodylessRewardgift = isRewardgift && !text.trimEnd();

    if (isRewardgift) {
      ingestChannelPointRewardTags(tags, channelId);
    }

    const login = tags.login;
    const rewardId = tags['custom-reward-id'];

    // A bodyless rewardgift is the header of a redemption whose message has
    // not arrived yet, so hold it until the pair can publish together.
    if (isBodylessRewardgift && login && rewardId) {
      registerDeferredRewardgiftStandalone({
        login,
        rewardId,
        publish: () => {
          const redemptionNotice = {
            ...createUserNoticeMessage({
              tags,
              channelName,
              text,
              timestampFormat: getPreferences().chatTimestampFormat,
            }),
            ...historicalFlag(countUnread),
          };

          handleNewMessage(redemptionNotice, { countUnread });
        },
      });

      return;
    }

    const message = {
      ...createUserNoticeMessage({
        tags,
        channelName,
        text,
        timestampFormat: getPreferences().chatTimestampFormat,
      }),
      ...historicalFlag(countUnread),
    };

    if (message.message.length === 0) {
      reportUnrenderableNotice({
        msgId: tags['msg-id'],
        reason: 'no-body',
        stage: 'ingest',
        systemMsg: tags['system-msg'],
      });
      return;
    }

    const trimmedText = text.trimEnd();

    const needsEmoteProcessing =
      (message.isAnnouncement || message.isHighlightedMessage) &&
      Boolean(trimmedText);

    if (needsEmoteProcessing) {
      processMessageEmotes(
        trimmedText,
        message.userstate,
        message,
        tags['user-id'],
        countUnread,
      );

      return;
    }

    handleNewMessage(message, { countUnread });
  };

  const onUserNotice = (
    _channel: string,
    tags: UserNoticeTags,
    text: string,
  ) => {
    handleUserNoticeMessage(tags, text);
  };

  const onClearChat = (
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

    const { deletedMessageStyle, ignoreClearChat } = getPreferences();

    if (username && deletedMessageStyle === 'hidden') {
      appendSystemMessage(formatModerationSystemMessage(username, banDuration));
      removeChatMessagesByLogin(username);
      return;
    }

    if (username) {
      appendSystemMessage(formatModerationSystemMessage(username, banDuration));

      moderateChatMessagesByLogin(
        username,
        banDuration != null
          ? `Timed out (${banDuration}s)`
          : 'Permanently banned',
      );

      return;
    }

    /**
     * History replay comes through this same handler, so clearing here would
     * destroy the backfill the user is waiting on.
     */
    if (ignoreClearChat || isLoadingRecentMessagesRef?.current) {
      appendSystemMessage('A moderator cleared chat (history kept)');
      return;
    }

    clearLocalMessages();

    clearMessagesWithNotice(
      createSystemMessage(
        channelName,
        'A moderator cleared chat',
        getPreferences().chatTimestampFormat,
      ),
    );

    // The list renders the cleared store on the next frame; a scroll before that targets the removed rows.
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
  };

  const onClearMessage = (
    _channel: string,
    tags: Record<string, string>,
    targetMsgId: string,
  ) => {
    logger.chat.warn('Twitch CLEARMSG received', {
      channelId,
      channelName,
      login: tags['login'],
      roomId: tags['room-id'],
      targetMsgId,
    });

    if (getPreferences().deletedMessageStyle === 'hidden') {
      removeChatMessageById(targetMsgId);
      return;
    }

    moderateChatMessageById(targetMsgId, 'Deleted');
  };

  const onJoin = () => {
    logger.chat.info('Joined channel:', channelName);

    if (isLoadingRecentMessagesRef?.current || messages$.peek().length > 0) {
      return;
    }

    appendSystemMessage(`Connected to ${channelName}'s room`);
  };

  const onPart = (channel: string) => {
    /**
     * The shared socket can echo a stale PART for the previous room; only a
     * PART for this handler's own room may reset roomstate or clear messages.
     */
    if (!isSameIrcChannel(channel, channelName)) {
      logger.chat.info(
        `Ignoring stale PART for ${channel} while in ${channelName}`,
      );
      return;
    }

    logger.chat.info('Parted from channel:', channelName);
    applyRoomStateUpdate(roomStateTracker.reset());

    if (isMountedRef?.current === false) {
      return;
    }

    resetChannelSession('part');
    clearLocalMessages();
  };

  const onUserJoin = (_channel: string, username: string) => {
    if (!getPreferences().showJoinPartMessages) {
      return;
    }

    appendSystemMessage(`${username} joined`);
  };

  const onUserPart = (_channel: string, username: string) => {
    if (!getPreferences().showJoinPartMessages) {
      return;
    }

    appendSystemMessage(`${username} parted`);
  };

  const onNotice = (
    _channel: string,
    tags: Record<string, string>,
    messageText: string,
  ) => {
    const noticeId = tags['msg-id'];

    if (noticeId && SUPPRESSED_NOTICE_IDS.has(noticeId)) {
      return;
    }

    const formattedNotice = formatNoticeMessage(tags, messageText);

    if (!formattedNotice) {
      return;
    }

    appendSystemMessage(formattedNotice);
  };

  const onRoomState = (_channel: string, tags: Record<string, string>) => {
    applyRoomStateUpdate(roomStateTracker.ingest(tags));
  };

  const onReconnect = () => {
    appendSystemMessage('Reconnecting to Twitch chat…');
    applyRoomStateUpdate(roomStateTracker.reset());
  };

  const replayRouteHandlers: IrcRouteHandlers = {
    privmsg: (_channel, tags, text) => {
      handlePrivmsgMessage(tags, text, false);
    },
    usernotice: (_channel, tags, text) => {
      handleUserNoticeMessage(tags, text, false);
    },
    clearchat: onClearChat,
    clearmsg: onClearMessage,
    notice: onNotice,
    roomstate: onRoomState,
  };

  const handleRecentIrcMessage = (line: string) => {
    const ircMessage = parseIrcMessage(line);

    if (!ircMessage?.tags) {
      return;
    }

    routeIrcMessage(ircMessage, replayRouteHandlers);
  };

  return {
    handleRecentIrcMessage,
    onClearChat,
    onClearMessage,
    onJoin,
    onMessage,
    onNotice,
    onPart,
    onReconnect,
    onRoomState,
    onUserJoin,
    onUserPart,
    onUserNotice,
  };
}

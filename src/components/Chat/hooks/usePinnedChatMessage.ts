import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner-native';

import i18next from '@app/i18n/i18next';
import {
  getPinnedChatMessageText,
  type TwitchPinnedChatMessage,
  twitchService,
} from '@app/services/twitch-service';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { logger } from '@app/utils/logger';

import type { MessageActionData } from '../components/ChatMessage/RichChatMessage';

const PINNED_MESSAGE_REFRESH_INTERVAL_MS = 60_000;

export type PinnedChatMessageViewModel = {
  expiresAt?: string | null;
  messageId: string;
  pinnedByName?: string;
  senderName?: string;
  text: string;
  updatedAt?: string;
};

function createPinnedMessageViewModelFromApi(
  pinnedMessage: TwitchPinnedChatMessage,
): PinnedChatMessageViewModel {
  return {
    expiresAt: pinnedMessage.expires_at,
    messageId: pinnedMessage.message_id,
    pinnedByName: pinnedMessage.pinned_by_name ?? pinnedMessage.moderator_name,
    senderName: pinnedMessage.broadcaster_name,
    text: getPinnedChatMessageText(pinnedMessage),
    updatedAt: pinnedMessage.updated_at,
  };
}

function createPinnedMessageViewModelFromAction(
  message: MessageActionData<'usernotice'>,
): PinnedChatMessageViewModel {
  return {
    messageId: message.messageData.message_id,
    senderName: message.username,
    text: replaceEmotesWithText(message.message).trim(),
  };
}

export function usePinnedChatMessage({
  canModerateChat,
  channelId,
  moderatorId,
}: {
  canModerateChat: boolean;
  channelId: string;
  moderatorId?: string;
}) {
  const [pinnedMessage, setPinnedMessage] =
    useState<PinnedChatMessageViewModel | null>(null);
  const [pinnedMessageBusy, setPinnedMessageBusy] = useState(false);
  const pinnedMessageFetchIdRef = useRef(0);
  const pinnedMessageRefreshInFlightRef = useRef(false);
  const pinnedMessageId = pinnedMessage?.messageId;

  const loadPinnedMessage = useCallback(async () => {
    if (!canModerateChat || !moderatorId || !channelId) {
      setPinnedMessage(null);
      return;
    }

    const fetchId = pinnedMessageFetchIdRef.current + 1;
    pinnedMessageFetchIdRef.current = fetchId;

    try {
      // eslint-disable-next-line react-doctor/async-defer-await -- stale-fetch guard runs after network call
      const nextPinnedMessage = await twitchService.getPinnedChatMessage({
        broadcasterId: channelId,
        moderatorId,
      });

      if (pinnedMessageFetchIdRef.current !== fetchId) {
        return;
      }

      setPinnedMessage(
        nextPinnedMessage
          ? createPinnedMessageViewModelFromApi(nextPinnedMessage)
          : null,
      );
    } catch (error) {
      if (pinnedMessageFetchIdRef.current !== fetchId) {
        return;
      }

      setPinnedMessage(null);
      logger.chat.debug('Failed to load pinned chat message', error);
    }
  }, [canModerateChat, channelId, moderatorId]);

  const loadPinnedMessageRef = useRef(loadPinnedMessage);
  loadPinnedMessageRef.current = loadPinnedMessage;

  useEffect(() => {
    void loadPinnedMessageRef.current();
  }, [canModerateChat, channelId, moderatorId]);

  const handlePinnedMessageChanged = useCallback(
    (message: PinnedChatMessageViewModel) => {
      setPinnedMessage(message);
      void loadPinnedMessage();
    },
    [loadPinnedMessage],
  );

  const handlePinMessage = useCallback(
    (message: MessageActionData<'usernotice'>) => {
      const messageId = message.messageData.message_id?.trim();
      if (!canModerateChat || !moderatorId || !messageId) {
        return;
      }

      setPinnedMessageBusy(true);
      void twitchService
        .pinChatMessage({
          broadcasterId: channelId,
          messageId,
          moderatorId,
        })
        .then(() => {
          setPinnedMessage(createPinnedMessageViewModelFromAction(message));
          toast.success(i18next.t('chat:pinned.messagePinned'));
          void loadPinnedMessage();
        })
        .catch(error => {
          logger.chat.error('Failed to pin chat message', error);
          toast.error(i18next.t('chat:pinned.couldNotPin'));
        })
        .finally(() => {
          setPinnedMessageBusy(false);
        });
    },
    [canModerateChat, channelId, loadPinnedMessage, moderatorId],
  );

  const refreshPinnedMessage = useCallback(
    async ({
      messageId,
      silent = false,
    }: {
      messageId?: string;
      silent?: boolean;
    } = {}) => {
      const targetMessageId = messageId ?? pinnedMessage?.messageId;
      if (!canModerateChat || !moderatorId || !targetMessageId) {
        return;
      }

      if (silent && pinnedMessageRefreshInFlightRef.current) {
        return;
      }

      if (silent) {
        pinnedMessageRefreshInFlightRef.current = true;
      } else {
        setPinnedMessageBusy(true);
      }

      try {
        await twitchService.updatePinnedChatMessage({
          broadcasterId: channelId,
          messageId: targetMessageId,
          moderatorId,
        });

        if (!silent) {
          toast.success(i18next.t('chat:pinned.pinRefreshed'));
        }
        await loadPinnedMessage();
      } catch (error) {
        logger.chat.error('Failed to update pinned chat message', error);
        if (!silent) {
          toast.error(i18next.t('chat:pinned.couldNotRefreshPin'));
        }
      } finally {
        if (silent) {
          pinnedMessageRefreshInFlightRef.current = false;
        } else {
          setPinnedMessageBusy(false);
        }
      }
    },
    [
      canModerateChat,
      channelId,
      loadPinnedMessage,
      moderatorId,
      pinnedMessage?.messageId,
    ],
  );

  const handleRefreshPinnedMessage = useCallback(
    (messageId?: string) => {
      void refreshPinnedMessage({ messageId });
    },
    [refreshPinnedMessage],
  );

  const refreshPinnedMessageRef = useRef(refreshPinnedMessage);
  refreshPinnedMessageRef.current = refreshPinnedMessage;

  useEffect(() => {
    if (!canModerateChat || !moderatorId || !pinnedMessageId) {
      return;
    }

    const refreshIntervalId = setInterval(() => {
      void refreshPinnedMessageRef.current({
        messageId: pinnedMessageId,
        silent: true,
      });
    }, PINNED_MESSAGE_REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshIntervalId);
  }, [canModerateChat, moderatorId, pinnedMessageId]);

  const handleUnpinPinnedMessage = useCallback(() => {
    if (!canModerateChat || !moderatorId) {
      return;
    }

    setPinnedMessageBusy(true);
    void twitchService
      .unpinChatMessage({
        broadcasterId: channelId,
        moderatorId,
      })
      .then(() => {
        setPinnedMessage(null);
        toast.success(i18next.t('chat:pinned.messageUnpinned'));
      })
      .catch(error => {
        logger.chat.error('Failed to unpin chat message', error);
        toast.error(i18next.t('chat:pinned.couldNotUnpin'));
      })
      .finally(() => {
        setPinnedMessageBusy(false);
      });
  }, [canModerateChat, channelId, moderatorId]);

  return {
    handlePinMessage,
    handlePinnedMessageChanged,
    handleRefreshPinnedMessage,
    handleUnpinPinnedMessage,
    pinnedMessage,
    pinnedMessageBusy,
    pinnedMessageId,
  } as const;
}

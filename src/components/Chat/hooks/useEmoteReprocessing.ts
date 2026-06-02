import { getCurrentEmoteData } from '@app/store/chatStore/channelLoad';
import { updateMessage } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { processEmotesOnChatRuntimeSync } from '@app/utils/chat/emoteProcessor';
import { findBadges } from '@app/utils/chat/findBadges';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { type MutableRefObject, useEffect, useRef } from 'react';

import type { AnyChatMessageType } from '../util/messageHandlers';

const EMOTE_REPROCESS_BATCH_SIZE = 24;

export function useEmoteReprocessing({
  channelId,
  channelEmoteData,
  messages$,
  emoteLoadStatus,
  processedMessageIdsRef,
  reprocessKey,
}: {
  channelId: string;
  channelEmoteData: unknown;
  messages$: { peek: () => unknown[] };
  emoteLoadStatus: string;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
  reprocessKey?: string;
}) {
  const previousReprocessKeyRef = useRef(reprocessKey);

  useEffect(() => {
    if (previousReprocessKeyRef.current !== reprocessKey) {
      processedMessageIdsRef.current.clear();
      previousReprocessKeyRef.current = reprocessKey;
    }

    if (emoteLoadStatus !== 'success') {
      return;
    }

    const emoteData = getCurrentEmoteData(channelId);

    if (!emoteData) {
      return;
    }

    const hasEmotes =
      chatStore$.emojis.peek().length > 0 ||
      emoteData.sevenTvGlobalEmotes.length > 0 ||
      emoteData.sevenTvChannelEmotes.length > 0 ||
      emoteData.twitchGlobalEmotes.length > 0 ||
      emoteData.twitchChannelEmotes.length > 0 ||
      emoteData.bttvGlobalEmotes.length > 0 ||
      emoteData.bttvChannelEmotes.length > 0 ||
      emoteData.ffzGlobalEmotes.length > 0 ||
      emoteData.ffzChannelEmotes.length > 0;

    const currentMessages = messages$.peek();

    if (!hasEmotes || currentMessages.length === 0) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let index = 0;

    const processMessage = (msg: AnyChatMessageType | undefined) => {
      if (!msg?.message_id || !Array.isArray(msg.message)) {
        return;
      }

      if (msg.sender === 'System' || 'notice_tags' in msg) {
        return;
      }

      if (processedMessageIdsRef.current.has(msg.message_id)) {
        return;
      }

      const textContent = getReprocessableText(msg.message);

      if (textContent == null) {
        return;
      }

      processedMessageIdsRef.current.add(msg.message_id);

      if (!textContent.trim()) {
        return;
      }

      const replacedMessage = processEmotesOnChatRuntimeSync({
        inputString: textContent.trimEnd(),
        userstate: msg.userstate,
        emojiEmotes: chatStore$.emojis.peek(),
        sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
        sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
        twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
        twitchChannelEmotes: emoteData.twitchChannelEmotes,
        ffzChannelEmotes: emoteData.ffzChannelEmotes,
        ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
        bttvChannelEmotes: emoteData.bttvChannelEmotes,
        bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
      });

      const replacedBadges = findBadges({
        userstate: msg.userstate,
        chatterinoBadges: emoteData.chatterinoBadges,
        chatUsers: [],
        ffzChannelBadges: emoteData.ffzChannelBadges,
        ffzGlobalBadges: emoteData.ffzGlobalBadges,
        twitchChannelBadges: emoteData.twitchChannelBadges,
        twitchGlobalBadges: emoteData.twitchGlobalBadges,
      });
      updateMessage(msg.message_id, msg.message_nonce, {
        message: replacedMessage,
        badges: replacedBadges,
      });
    };

    const processBatch = () => {
      if (cancelled) {
        return;
      }

      let processedInBatch = 0;
      while (
        index < currentMessages.length &&
        processedInBatch < EMOTE_REPROCESS_BATCH_SIZE
      ) {
        processMessage(
          currentMessages[index] as AnyChatMessageType | undefined,
        );
        index += 1;
        processedInBatch += 1;
      }

      if (index < currentMessages.length) {
        timer = setTimeout(() => {
          processBatch();
        }, 0);
      }
    };

    processBatch();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    channelId,
    channelEmoteData,
    messages$,
    emoteLoadStatus,
    processedMessageIdsRef,
    reprocessKey,
  ]);
}

function getReprocessableText(parts: ParsedPart[]): string | null {
  let textContent = '';

  for (const part of parts) {
    if (part.type === 'text' || part.type === 'mention') {
      textContent += part.content;
      continue;
    }

    if (part.type === 'emote') {
      textContent += part.original_name || part.name || part.content;
      continue;
    }

    return null;
  }

  return textContent;
}

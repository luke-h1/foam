import { getCurrentEmoteData } from '@app/store/chatStore/channelLoad';
import { updateMessage } from '@app/store/chatStore/messages';
import { chatStore$ } from '@app/store/chatStore/state';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { findBadges } from '@app/utils/chat/findBadges';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { type MutableRefObject, useEffect } from 'react';

import type { AnyChatMessageType } from '../util/messageHandlers';

export function useEmoteReprocessing({
  channelId,
  channelEmoteData,
  messages$,
  emoteLoadStatus,
  processedMessageIdsRef,
}: {
  channelId: string;
  channelEmoteData: unknown;
  messages$: { peek: () => unknown[] };
  emoteLoadStatus: string;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
}) {
  useEffect(() => {
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

    for (const msg of currentMessages as AnyChatMessageType[]) {
      if (processedMessageIdsRef.current.has(msg.message_id)) {
        continue;
      }

      if (msg.sender === 'System' || 'notice_tags' in msg) {
        continue;
      }

      let textContent = '';
      let allPartsAreText = true;

      for (const part of msg.message as ParsedPart[]) {
        if (part.type !== 'text') {
          allPartsAreText = false;
          break;
        }

        textContent += (part as { content: string }).content;
      }

      if (!allPartsAreText) {
        continue;
      }

      processedMessageIdsRef.current.add(msg.message_id);

      if (!textContent.trim()) {
        continue;
      }

      const replacedMessage = processEmotesWorklet({
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
    }
  }, [
    channelId,
    channelEmoteData,
    messages$,
    emoteLoadStatus,
    processedMessageIdsRef,
  ]);
}

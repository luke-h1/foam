import { getCurrentEmoteData, updateMessage } from '@app/store/chatStore';
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

    const textOnlyMessages = (currentMessages as AnyChatMessageType[]).filter(
      msg =>
        !processedMessageIdsRef.current.has(msg.message_id) &&
        msg.sender !== 'System' &&
        !('notice_tags' in msg) &&
        msg.message.every((part: ParsedPart) => part.type === 'text'),
    );

    textOnlyMessages.forEach(msg => {
      processedMessageIdsRef.current.add(msg.message_id);
      const textContent = msg.message
        .filter((p: ParsedPart) => p.type === 'text')
        .map((p: ParsedPart) => (p as { content: string }).content)
        .join('');

      if (!textContent.trim()) {
        return;
      }

      const replacedMessage = processEmotesWorklet({
        inputString: textContent.trimEnd(),
        userstate: msg.userstate,
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
    });
  }, [
    channelId,
    channelEmoteData,
    messages$,
    emoteLoadStatus,
    processedMessageIdsRef,
  ]);
}

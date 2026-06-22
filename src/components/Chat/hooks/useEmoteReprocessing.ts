import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { findBadges } from '@app/utils/chat/findBadges';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import type { AnyChatMessageType } from '../util/messageHandlers';

const EMOTE_REPROCESS_BATCH_DELAY_MS = 32;
const EMOTE_REPROCESS_BATCH_SIZE = 6;

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
  messages$: { peek: () => AnyChatMessageType[] };
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
    let pendingUpdates: Parameters<typeof updateMessages>[0] = [];

    const processMessage = (msg?: AnyChatMessageType) => {
      if (!msg?.message_id || !Array.isArray(msg.message)) {
        return;
      }

      if (
        msg.sender === 'System' ||
        ('notice_tags' in msg &&
          msg.notice_tags &&
          !msg.isAnnouncement &&
          !msg.isHighlightedMessage)
      ) {
        return;
      }

      const hasUnparsedMention = msg.message.some(
        part => part.type === 'text' && /(?:^|\s)@[\w-]+/.test(part.content),
      );

      if (
        processedMessageIdsRef.current.has(msg.message_id) &&
        !hasUnparsedMention
      ) {
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

      if (
        areParsedPartsEqual(msg.message, replacedMessage) &&
        areBadgesEqual(msg.badges, replacedBadges)
      ) {
        return;
      }

      pendingUpdates.push({
        messageId: msg.message_id,
        messageNonce: msg.message_nonce,
        updates: {
          message: replacedMessage,
          badges: replacedBadges,
        },
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
        processMessage(currentMessages[index]);
        index += 1;
        processedInBatch += 1;
      }

      if (pendingUpdates.length > 0) {
        updateMessages(pendingUpdates);
        pendingUpdates = [];
      }

      if (index < currentMessages.length) {
        timer = setTimeout(processBatch, EMOTE_REPROCESS_BATCH_DELAY_MS);
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

function areBadgesEqual(
  previous?: AnyChatMessageType['badges'],
  next?: AnyChatMessageType['badges'],
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || !next || previous.length !== next.length) {
    return false;
  }

  for (let index = 0; index < previous.length; index += 1) {
    const previousBadge = previous[index];
    const nextBadge = next[index];

    if (!previousBadge || !nextBadge) {
      return false;
    }

    if (
      previousBadge.id !== nextBadge.id ||
      previousBadge.url !== nextBadge.url ||
      previousBadge.type !== nextBadge.type ||
      previousBadge.title !== nextBadge.title ||
      previousBadge.set !== nextBadge.set ||
      previousBadge.provider !== nextBadge.provider ||
      previousBadge.color !== nextBadge.color ||
      previousBadge.owner_username !== nextBadge.owner_username
    ) {
      return false;
    }
  }

  return true;
}

function areImageVariantsEqual(
  previous?: ParsedPart<'emote'>['image_variants'],
  next?: ParsedPart<'emote'>['image_variants'],
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return false;
  }

  return (
    previous.animated?.['1x'] === next.animated?.['1x'] &&
    previous.animated?.['2x'] === next.animated?.['2x'] &&
    previous.animated?.['3x'] === next.animated?.['3x'] &&
    previous.animated?.['4x'] === next.animated?.['4x'] &&
    previous.static?.['1x'] === next.static?.['1x'] &&
    previous.static?.['2x'] === next.static?.['2x'] &&
    previous.static?.['3x'] === next.static?.['3x'] &&
    previous.static?.['4x'] === next.static?.['4x']
  );
}

function areParsedPartEqual(previous: ParsedPart, next: ParsedPart): boolean {
  if (previous === next) {
    return true;
  }
  if (
    previous.type !== next.type ||
    getParsedPartContent(previous) !== getParsedPartContent(next)
  ) {
    return false;
  }

  if (previous.type !== 'emote' || next.type !== 'emote') {
    return true;
  }

  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.original_name === next.original_name &&
    previous.url === next.url &&
    previous.static_url === next.static_url &&
    previous.width === next.width &&
    previous.height === next.height &&
    previous.zero_width === next.zero_width &&
    previous.creator === next.creator &&
    previous.site === next.site &&
    areImageVariantsEqual(previous.image_variants, next.image_variants)
  );
}

function areParsedPartsEqual(
  previous?: ParsedPart[],
  next?: ParsedPart[],
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || !next || previous.length !== next.length) {
    return false;
  }

  for (let index = 0; index < previous.length; index += 1) {
    const previousPart = previous[index];
    const nextPart = next[index];

    if (!previousPart || !nextPart) {
      return false;
    }

    if (!areParsedPartEqual(previousPart, nextPart)) {
      return false;
    }
  }

  return true;
}

function getParsedPartContent(part: ParsedPart) {
  return 'content' in part ? part.content : undefined;
}

function getReprocessableText(parts: ParsedPart[]): string | null {
  let textContent = '';

  for (const part of parts) {
    if (part.type === 'text' || part.type === 'mention') {
      textContent += part.content;
      continue;
    }

    if (part.type === 'emote') {
      textContent += part.content || part.name || part.original_name;
      continue;
    }

    return null;
  }

  return textContent;
}

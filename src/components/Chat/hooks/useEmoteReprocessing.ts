import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { updateMessages } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { findBadges } from '@app/utils/chat/findBadges';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import type { AnyChatMessageType } from '../util/messageHandlers';
import { resolveMessageEmoteParts } from '../util/resolveMessageEmoteParts';

const EMOTE_REPROCESS_BATCH_DELAY_MS = 32;
const EMOTE_REPROCESS_BATCH_SIZE = 6;
// The processed-id set is only cleared on reprocess-key changes, but each
// effect run (7TV emote_set.update, etc.) can add a window's worth of ids -
// multi-hour stays in one busy channel accumulated ~1MB/hr of id strings.
// Overflow resets the set; the equality checks make the one extra full pass
// cheap.
const MAX_PROCESSED_MESSAGE_IDS = 5000;

export function useEmoteReprocessing({
  channelId,
  channelEmoteData,
  messages$,
  emoteLoadStatus,
  processedMessageIdsRef,
  reprocessKey,
  show7TvEmotes,
  userLogin,
}: {
  channelId: string;
  channelEmoteData: unknown;
  messages$: { peek: () => AnyChatMessageType[] };
  emoteLoadStatus: string;
  processedMessageIdsRef: MutableRefObject<Set<string>>;
  reprocessKey?: string;
  show7TvEmotes: boolean;
  userLogin?: string | null;
}) {
  const previousReprocessKeyRef = useRef(reprocessKey);

  useEffect(() => {
    if (previousReprocessKeyRef.current !== reprocessKey) {
      processedMessageIdsRef.current.clear();
      previousReprocessKeyRef.current = reprocessKey;
    } else if (
      processedMessageIdsRef.current.size > MAX_PROCESSED_MESSAGE_IDS
    ) {
      processedMessageIdsRef.current.clear();
    }

    if (emoteLoadStatus !== 'success') {
      return;
    }

    const emoteData = getCurrentEmoteData(channelId);

    if (!emoteData) {
      return;
    }

    const hasEmotes =
      // Personal 7TV emotes are per-sender, not part of the channel emote data,
      // so a personal-emote-only channel would otherwise skip reprocessing.
      show7TvEmotes ||
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
      if (!msg?.message_id || !Array.isArray(msg.message) || !msg.userstate) {
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

      if (processedMessageIdsRef.current.has(msg.message_id)) {
        // Already-processed messages get one more look only when a text part
        // still carries a raw @mention (its login resolved after the last
        // pass). The regex runs behind the membership check - running it
        // first scanned every text part of every message on every effect run.
        const hasUnparsedMention = msg.message.some(
          part => part.type === 'text' && /(?:^|\s)@[\w-]+/.test(part.content),
        );
        if (!hasUnparsedMention) {
          return;
        }
      }

      const textContent = getReprocessableText(msg.message);

      if (textContent == null) {
        return;
      }

      processedMessageIdsRef.current.add(msg.message_id);

      if (!textContent.trim()) {
        return;
      }

      // Route through the shared resolver (not the worklet directly) so the
      // sender's 7TV personal emotes and tagged subscriber emotes still resolve;
      // otherwise an emote resolved on ingest downgrades back to text here.
      const replacedMessage = resolveMessageEmoteParts({
        channelId,
        emoteData,
        show7TvEmotes,
        text: textContent.trimEnd(),
        userId: msg.userstate['user-id'],
        userLogin,
        userstate: msg.userstate,
      });

      const replacedBadges = findBadges({
        userstate: msg.userstate,
        bttvBadges: emoteData.bttvBadges,
        chatterinoBadges: emoteData.chatterinoBadges,
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
    show7TvEmotes,
    userLogin,
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

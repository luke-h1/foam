import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { findBadges } from '@app/utils/chat/findBadges';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { resolveMessageEmoteParts } from '@app/utils/chat/resolveMessageEmoteParts';
import { getMessageBadges } from '@app/utils/chat/sharedChatBadges/getMessageBadges';
import { getSharedChatBadgeContext } from '@app/utils/chat/sharedChatBadges/getSharedChatBadgeContext';
import { logger } from '@app/utils/logger';

import { chatStore$ } from '../observables/chatStore';
import type { AnyChatMessageType } from '../types/constants';
import { getCurrentEmoteData } from './channelLoad';
import { updateMessages } from './messages';

type ChatEmoteData = NonNullable<ReturnType<typeof getCurrentEmoteData>>;

const ENRICH_BATCH_SIZE = 6;
const ENRICH_BATCH_DELAY_MS = 32;

/**
 * The one skip predicate for post-commit enrichment: system rows and most
 * usernotices never have their parts or badges recomputed.
 */
export function shouldEnrichMessage(message: AnyChatMessageType): boolean {
  if (message.sender === 'System') {
    return false;
  }

  if (
    'notice_tags' in message &&
    message.notice_tags &&
    !message.isAnnouncement &&
    !message.isHighlightedMessage
  ) {
    return false;
  }

  return true;
}

/**
 * With `includePersonalEmotes` the answer is always yes: personal 7TV emotes
 * are per-sender, so a personal-emote-only channel would skip enrichment.
 */
export function hasEnrichmentEmoteSources(
  emoteData: ChatEmoteData,
  options?: { includePersonalEmotes?: boolean },
): boolean {
  if (options?.includePersonalEmotes) {
    return true;
  }

  return (
    chatStore$.emojis.peek().length > 0 ||
    emoteData.twitchGlobalEmotes.length > 0 ||
    emoteData.twitchChannelEmotes.length > 0 ||
    emoteData.twitchSubscriberEmotes.length > 0 ||
    emoteData.sevenTvGlobalEmotes.length > 0 ||
    emoteData.sevenTvChannelEmotes.length > 0 ||
    emoteData.bttvGlobalEmotes.length > 0 ||
    emoteData.bttvChannelEmotes.length > 0 ||
    emoteData.ffzGlobalEmotes.length > 0 ||
    emoteData.ffzChannelEmotes.length > 0
  );
}

/**
 * Recomputes parts and badges for committed messages in timed batches so a
 * full window never parses in one tick. Returns a cancel function.
 */
export function enrichMessageSet({
  channelId,
  emoteData,
  messages,
  processedMessageIds,
  show7TvEmotes,
  userLogin,
}: {
  channelId: string;
  emoteData: ChatEmoteData;
  messages: (AnyChatMessageType | undefined)[];
  processedMessageIds?: Set<string>;
  show7TvEmotes: boolean;
  userLogin?: string | null;
}): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let index = 0;
  let pendingUpdates: Parameters<typeof updateMessages>[0] = [];

  const processMessage = (msg?: AnyChatMessageType) => {
    if (!msg?.message_id || !Array.isArray(msg.message) || !msg.userstate) {
      return;
    }

    if (!shouldEnrichMessage(msg)) {
      return;
    }

    if (processedMessageIds?.has(msg.message_id)) {
      // Re-check only when a text part still has a raw @mention.
      const hasUnparsedMention = msg.message.some(
        part => part.type === 'text' && /(?:^|\s)@[\w-]+/.test(part.content),
      );
      if (!hasUnparsedMention) {
        return;
      }
    }

    const textContent = getEnrichableText(msg.message);

    if (textContent == null) {
      return;
    }

    processedMessageIds?.add(msg.message_id);

    if (!textContent.trim()) {
      return;
    }

    // Shared resolver keeps personal / tagged sub emotes from downgrading to text.
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
      getEntitledBadge: getUserBadge,
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
    while (index < messages.length && processedInBatch < ENRICH_BATCH_SIZE) {
      processMessage(messages[index]);
      index += 1;
      processedInBatch += 1;
    }

    if (pendingUpdates.length > 0) {
      updateMessages(pendingUpdates);
      pendingUpdates = [];
    }

    if (index < messages.length) {
      timer = setTimeout(processBatch, ENRICH_BATCH_DELAY_MS);
    }
  };

  processBatch();

  return () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
    }
  };
}

/**
 * Recomputes a single visible message from the current caches, awaiting the
 * shared-chat badge context so the source badge lands with the parts.
 */
export async function enrichVisibleMessage({
  channelId,
  message,
  show7TvEmotes,
  userLogin,
}: {
  channelId: string;
  message: AnyChatMessageType;
  show7TvEmotes: boolean;
  userLogin?: string | null;
}): Promise<void> {
  if (!shouldEnrichMessage(message)) {
    return;
  }

  const emoteData = getCurrentEmoteData(channelId);
  if (!emoteData) {
    return;
  }

  const text = replaceEmotesWithText(message.message).trimEnd();
  if (!text.trim()) {
    return;
  }

  const userId = message.userstate['user-id'];

  try {
    const replacedMessage = resolveMessageEmoteParts({
      channelId,
      emoteData,
      show7TvEmotes,
      text,
      userId,
      userLogin,
      userstate: message.userstate,
    });

    const { sourceBadge, sourceChannelBadges } =
      await getSharedChatBadgeContext(message.userstate);
    const badges = getMessageBadges({
      userstate: message.userstate,
      emoteData,
      sourceBadge,
      sourceChannelBadges,
    });

    updateMessages([
      {
        messageId: message.message_id,
        messageNonce: message.message_nonce,
        updates: {
          message: replacedMessage,
          badges,
        },
      },
    ]);
  } catch (error) {
    logger.chat.debug('Failed to reprocess visible chat message:', error);
  }
}

/**
 * Rewrites a committed message's badges once the shared-chat source context
 * resolves; called when the message was composed from an incomplete cache.
 */
export function refreshSharedChatBadges({
  emoteData,
  messageId,
  messageNonce,
  userstate,
}: {
  emoteData: ChatEmoteData;
  messageId: string;
  messageNonce: string;
  userstate: UserStateTags;
}): void {
  void getSharedChatBadgeContext(userstate)
    .then(({ sourceBadge, sourceChannelBadges }) => {
      updateMessages([
        {
          messageId,
          messageNonce,
          updates: {
            badges: getMessageBadges({
              userstate,
              emoteData,
              sourceBadge,
              sourceChannelBadges,
            }),
          },
        },
      ]);
    })
    .catch(error => {
      logger.chat.debug('Failed to update shared chat badges:', error);
    });
}

function areBadgesEqual(
  previous?: AnyChatMessageType['badges'],
  next?: AnyChatMessageType['badges'],
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || previous.length !== next?.length) {
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
  if (!previous || previous.length !== next?.length) {
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

function getEnrichableText(parts: ParsedPart[]): string | null {
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

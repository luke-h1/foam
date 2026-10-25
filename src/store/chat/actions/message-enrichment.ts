import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { extractEmotesFromTag } from '@app/utils/chat/extract-emotes/extract-emotes-from-tag';
import type { MessageToken } from '@app/utils/chat/message-token';
import { resolveMessageEmoteParts } from '@app/utils/chat/resolve-message-emote-tokens';
import { getMessageBadges } from '@app/utils/chat/shared-chat-badges/get-message-badges';
import { getSharedChatBadgeContext } from '@app/utils/chat/shared-chat-badges/get-shared-chat-badge-context';
import { logger } from '@app/utils/logger';

import { chatStore$ } from '../observables/chat-store';
import type { AnyChatMessageType } from '../types/constants';
import { getCurrentEmoteData } from './channel-load';
import { type MessageUpdateInput, updateMessages } from './messages';

type ChatEmoteData = ReturnType<typeof getCurrentEmoteData>;

const ENRICH_BATCH_SIZE = 6;
const ENRICH_BATCH_DELAY_MS = 32;

/**
 * The first batch commits at once so emotes start to show. Later batches
 * commit every fourth, so a full window is a handful of store writes rather
 * than one per batch while live rows are also committing.
 */
const ENRICH_PUBLISH_EVERY_BATCHES = 4;

/**
 * The one skip predicate for post-commit enrichment: system rows and most
 * user notices never have their tokens or badges recomputed.
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

interface EnrichMessageSetOptions {
  channelId: string;
  emoteData: ChatEmoteData;
  messages: (AnyChatMessageType | undefined)[];
  processedMessageIds?: Set<string>;
  show7TvEmotes: boolean;
  showChatGifs?: boolean;
  userLogin?: string | null;
}

/**
 * Recomputes tokens and badges for committed messages in timed batches so a
 * full window never parses in one tick. Returns a cancel function.
 */
export function enrichMessageSet({
  channelId,
  emoteData,
  messages,
  processedMessageIds,
  show7TvEmotes,
  showChatGifs = false,
  userLogin,
}: EnrichMessageSetOptions): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let index = 0;
  let batchesSincePublish = 0;
  let hasPublished = false;
  let pendingUpdates: Parameters<typeof updateMessages>[0] = [];

  const processMessage = (msg?: AnyChatMessageType) => {
    if (!msg?.message_id || !Array.isArray(msg.message) || !msg.userstate) {
      return;
    }

    if (!shouldEnrichMessage(msg)) {
      return;
    }

    // An already-processed message is only re-checked when a text token still
    // holds a raw @mention.
    const needsMentionRecheck =
      !processedMessageIds?.has(msg.message_id) ||
      msg.message.some(
        token => token.type === 'text' && /(?:^|\s)@[\w-]+/.test(token.content),
      );

    if (!needsMentionRecheck) {
      return;
    }

    const replacedMessage = resolveStoredMessageTokens({
      channelId,
      emoteData,
      show7TvEmotes,
      showChatGifs,
      tokens: msg.message,
      userId: msg.userstate['user-id'],
      userLogin,
      userstate: msg.userstate,
    });

    if (replacedMessage == null) {
      return;
    }

    processedMessageIds?.add(msg.message_id);

    if (replacedMessage.length === 0) {
      return;
    }

    const replacedBadges = getMessageBadges({
      userstate: msg.userstate,
      emoteData,
    });

    if (
      areMessageTokensEqual(msg.message, replacedMessage) &&
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

    batchesSincePublish += 1;
    const isLastBatch = index >= messages.length;

    if (
      pendingUpdates.length > 0 &&
      (isLastBatch ||
        !hasPublished ||
        batchesSincePublish >= ENRICH_PUBLISH_EVERY_BATCHES)
    ) {
      updateMessages(pendingUpdates);
      pendingUpdates = [];
      batchesSincePublish = 0;
      hasPublished = true;
    }

    if (!isLastBatch) {
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

interface ResolveVisibleMessageUpdateOptions {
  channelId: string;
  message: AnyChatMessageType;
  show7TvEmotes: boolean;
  showChatGifs?: boolean;
  userLogin?: string | null;
}

/**
 * Recomputes a single visible message from the current caches, awaiting the
 * shared-chat badge context so the source badge lands with the tokens. Returns
 * the store update without publishing it, so a hydration pass can commit a
 * whole batch of rows in one store write.
 */
export async function resolveVisibleMessageUpdate({
  channelId,
  message,
  show7TvEmotes,
  showChatGifs = false,
  userLogin,
}: ResolveVisibleMessageUpdateOptions): Promise<MessageUpdateInput | null> {
  if (!shouldEnrichMessage(message)) {
    return null;
  }

  const emoteData = getCurrentEmoteData(channelId);

  try {
    const replacedMessage = resolveStoredMessageTokens({
      channelId,
      emoteData,
      show7TvEmotes,
      showChatGifs,
      tokens: message.message,
      userId: message.userstate['user-id'],
      userLogin,
      userstate: message.userstate,
    });

    if (!replacedMessage?.length) {
      return null;
    }

    const { sourceBadge, sourceChannelBadges } =
      await getSharedChatBadgeContext(message.userstate);

    const badges = getMessageBadges({
      userstate: message.userstate,
      emoteData,
      sourceBadge,
      sourceChannelBadges,
    });

    return {
      messageId: message.message_id,
      messageNonce: message.message_nonce,
      updates: {
        message: replacedMessage,
        badges,
      },
    };
  } catch (error) {
    logger.chat.debug('Failed to reprocess visible chat message:', error);
    return null;
  }
}

interface RefreshSharedChatBadgesOptions {
  emoteData: ChatEmoteData;
  messageId: string;
  messageNonce: string;
  userstate: UserStateTags;
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
}: RefreshSharedChatBadgesOptions): void {
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
  previous?: MessageToken<'emote'>['image_variants'],
  next?: MessageToken<'emote'>['image_variants'],
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

function areMessageTokenEqual(
  previous: MessageToken,
  next: MessageToken,
): boolean {
  if (previous === next) {
    return true;
  }

  if (
    previous.type !== next.type ||
    getMessageTokenContent(previous) !== getMessageTokenContent(next)
  ) {
    return false;
  }

  if (previous.type === 'gif' && next.type === 'gif') {
    return previous.gifId === next.gifId && previous.url === next.url;
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

function areMessageTokensEqual(
  previous?: MessageToken[],
  next?: MessageToken[],
): boolean {
  if (previous === next) {
    return true;
  }

  if (!previous || previous.length !== next?.length) {
    return false;
  }

  for (let index = 0; index < previous.length; index += 1) {
    const previousToken = previous[index];
    const nextPart = next[index];

    if (!previousToken || !nextPart) {
      return false;
    }

    if (!areMessageTokenEqual(previousToken, nextPart)) {
      return false;
    }
  }

  return true;
}

function getMessageTokenContent(token: MessageToken) {
  return 'content' in token ? token.content : undefined;
}

interface ResolveStoredMessageTokensOptions {
  channelId: string;
  emoteData: ChatEmoteData;
  show7TvEmotes: boolean;
  showChatGifs: boolean;
  tokens: MessageToken[];
  userId?: string;
  userLogin?: string | null;
  userstate: UserStateTags;
}

function resolveStoredMessageTokens({
  channelId,
  emoteData,
  show7TvEmotes,
  showChatGifs,
  tokens,
  userId,
  userLogin,
  userstate,
}: ResolveStoredMessageTokensOptions): MessageToken[] | null {
  const keepExistingGifs =
    showChatGifs && tokens.some(token => token.type === 'gif');

  if (!keepExistingGifs) {
    const textContent = getEnrichableText(tokens);

    if (textContent == null || !textContent.trim()) {
      return textContent == null ? null : [];
    }

    return resolveMessageEmoteParts({
      channelId,
      emoteData,
      show7TvEmotes,
      showChatGifs,
      text: textContent.trimEnd(),
      userId,
      userLogin,
      userstate,
    });
  }

  const rebuiltBody = getEnrichableText(tokens);

  const taggedSubscriberEmotes = rebuiltBody
    ? extractEmotesFromTag(userstate.emotes, rebuiltBody.trimEnd())
    : [];

  const resolved: MessageToken[] = [];
  let gap: MessageToken[] = [];

  const flushGap = (trimEnd: boolean) => {
    const textContent = getEnrichableText(gap);
    gap = [];

    if (textContent == null) {
      return false;
    }

    const text = trimEnd ? textContent.trimEnd() : textContent;

    if (!text) {
      return true;
    }

    resolved.push(
      ...resolveMessageEmoteParts({
        channelId,
        emoteData,
        show7TvEmotes,
        showChatGifs: false,
        taggedSubscriberEmotes,
        text,
        userId,
        userLogin,
        userstate: { ...userstate, emotes: undefined },
      }),
    );

    return true;
  };

  for (const token of tokens) {
    if (token.type !== 'gif') {
      gap.push(token);
      continue;
    }

    if (!flushGap(false)) {
      return null;
    }

    resolved.push(token);
  }

  if (!flushGap(true)) {
    return null;
  }

  return resolved;
}

function emoteSourceText(token: MessageToken<'emote'>): string {
  const base = token.content || token.name || token.original_name || '';

  const overlaid = (token.overlaid ?? [])
    .flatMap(overlay => {
      const name = overlay.content || overlay.name || overlay.original_name;

      return name ? [name] : [];
    })
    .join(' ');

  return overlaid ? `${base} ${overlaid}` : base;
}

function getEnrichableText(tokens: MessageToken[]): string | null {
  let textContent = '';

  for (const token of tokens) {
    if (
      token.type === 'text' ||
      token.type === 'mention' ||
      token.type === 'link'
    ) {
      textContent += token.content;
      continue;
    }

    if (token.type === 'emote') {
      textContent += emoteSourceText(token);
      continue;
    }

    if (token.type === 'gif') {
      textContent += token.content;
      continue;
    }

    return null;
  }

  return textContent;
}

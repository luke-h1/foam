import { theme } from '@app/styles/themes';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  measureInlineFlow,
  prepareInlineFlow,
  type InlineFlowItem,
  type TextStyle,
} from './expoPretext';

import { hasSharedChannelPointsMessage } from './channelPointsSharedMessage';
import type { AnyChatMessageType } from './messageHandlers';

const COMPACT_LINE_HEIGHT = 14;
const COMPACT_FONT_SIZE = theme.fontSize11;
const COMFORTABLE_LINE_HEIGHT = 17;
const COMFORTABLE_FONT_SIZE = theme.fontSize14;
const ROW_VERTICAL_PADDING = 6;
const MIN_MEASURE_WIDTH = 80;
const NON_BREAKING_SPACE = '\u00A0';
const HEIGHT_CACHE_LIMIT = 2000;
const COMPACT_EMOTE_SIZE = 26;
const COMFORTABLE_EMOTE_SIZE = 30;
const REPLY_CONTEXT_GAP = 2;
const ZERO_WIDTH_EMOTE_REMAINING_WIDTH_RATIO = 0.28;
const SHARED_CHAT_LABEL_HEIGHT = 18;
const SURFACE_VERTICAL_PADDING = 8;
const ESTIMATE_HEIGHT_GUARD = 4;
const REPLY_PREFIX = 'Replying to @';

const heightCache = new Map<string, number>();

export interface PretextChatHeightOptions {
  containerWidth: number;
  density: 'comfortable' | 'compact';
  showInlineReplyContext: boolean;
  showTimestamp: boolean;
}

export function estimateChatMessageHeightWithPretext(
  message: AnyChatMessageType | undefined,
  options: PretextChatHeightOptions,
): number | undefined {
  if (!message || options.containerWidth < MIN_MEASURE_WIDTH) {
    return undefined;
  }

  const cacheKey = getCacheKey(message, options);
  const cached = heightCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const measured = measureChatMessageHeight(message, options);

  if (measured === undefined) {
    return undefined;
  }

  heightCache.set(cacheKey, measured);
  if (heightCache.size > HEIGHT_CACHE_LIMIT) {
    const oldestKey = heightCache.keys().next().value;
    if (oldestKey) {
      heightCache.delete(oldestKey);
    }
  }

  return measured;
}

function measureChatMessageHeight(
  message: AnyChatMessageType,
  options: PretextChatHeightOptions,
): number | undefined {
  if (!isEstimableChatMessage(message)) {
    return undefined;
  }

  const { density, showTimestamp } = options;
  const compact = density === 'compact';
  const fontSize = compact ? COMPACT_FONT_SIZE : COMFORTABLE_FONT_SIZE;
  const lineHeight = compact ? COMPACT_LINE_HEIGHT : COMFORTABLE_LINE_HEIGHT;
  const emoteSize = compact ? COMPACT_EMOTE_SIZE : COMFORTABLE_EMOTE_SIZE;

  const textStyle: TextStyle = {
    fontFamily: 'System',
    fontSize,
    lineHeight,
    fontWeight: '400',
  };

  const strongStyle: TextStyle = {
    ...textStyle,
    fontWeight: '700',
  };

  const auxiliaryStyle: TextStyle = {
    ...textStyle,
    fontSize: compact ? 10 : theme.fontSize11,
  };

  const items: InlineFlowItem[] = [];
  let minimumInlineHeight = lineHeight;
  let prelineHeight = 0;

  if (
    options.showInlineReplyContext &&
    (message.parentDisplayName || message.replyBody)
  ) {
    const replyBodyText = message.replyBody?.trim();
    const replyLabel = message.parentDisplayName
      ? `${REPLY_PREFIX}${message.parentDisplayName}`
      : 'Replying';

    const replyText = replyBodyText
      ? `${replyLabel}: ${replyBodyText}`
      : replyLabel;

    prelineHeight +=
      measureReplyContextHeight(
        replyText,
        lineHeight,
        auxiliaryStyle,
        compact,
        options.containerWidth,
      ) + REPLY_CONTEXT_GAP;
  }

  if (message.userstate['first-msg'] === '1') {
    prelineHeight += lineHeight + REPLY_CONTEXT_GAP;
  }

  if (message.isAnnouncement) {
    prelineHeight += lineHeight + REPLY_CONTEXT_GAP;
  } else if (message.isHighlightedMessage) {
    prelineHeight += lineHeight + REPLY_CONTEXT_GAP;
  } else if (
    message.isHighlightedMessage ||
    (message.isChannelPointRedemption &&
      hasSharedChannelPointsMessage(message.message))
  ) {
    prelineHeight += lineHeight + REPLY_CONTEXT_GAP;
  }

  if (message.isSharedChatDuplicated) {
    prelineHeight += SHARED_CHAT_LABEL_HEIGHT;
  }

  if (message.isSharedChatDuplicated || message.moderationNotice) {
    prelineHeight += SURFACE_VERTICAL_PADDING;
  }

  if (showTimestamp && message.timestamp) {
    items.push({
      text: `${message.timestamp}: `,
      style: auxiliaryStyle,
      atomic: true,
    });
  }

  const badgeSize = compact ? 16 : 20;
  for (let index = 0; index < (message.badges?.length ?? 0); index += 1) {
    items.push({
      text: NON_BREAKING_SPACE,
      style: textStyle,
      atomic: true,
      extraWidth: badgeSize + 2,
    });
  }

  const username = message.userstate.username || message.sender;
  if (username) {
    items.push({
      text: `${username}: `,
      style: strongStyle,
      atomic: true,
    });
  }

  for (const part of message.message) {
    if (part.type === 'text') {
      items.push({ text: part.content, style: textStyle });
      continue;
    }

    if (part.type === 'mention') {
      items.push({
        text: part.content,
        style: strongStyle,
        extraWidth: compact ? 2 : 4,
      });
      continue;
    }

    if (part.type === 'stvEmote') {
      minimumInlineHeight = Math.max(minimumInlineHeight, 28);
      items.push({
        text: NON_BREAKING_SPACE,
        style: textStyle,
        atomic: true,
        extraWidth: 120,
      });
      continue;
    }

    if (part.type === 'emote') {
      const { width, height } = getEstimatedEmoteSize(part, emoteSize);
      minimumInlineHeight = Math.max(minimumInlineHeight, height);
      items.push({
        text: NON_BREAKING_SPACE,
        style: textStyle,
        atomic: true,
        extraWidth: part.zero_width
          ? Math.round(width * ZERO_WIDTH_EMOTE_REMAINING_WIDTH_RATIO)
          : width,
      });
      continue;
    }

    if (part.type === 'twitchClip') {
      minimumInlineHeight = Math.max(minimumInlineHeight, emoteSize);
      items.push({
        text: part.content || part.name || 'clip',
        style: textStyle,
        atomic: true,
        extraWidth: emoteSize * 2,
      });
      continue;
    }

    if ('content' in part && part.content) {
      items.push({ text: part.content, style: textStyle });
    }
  }

  if (items.length === 0) {
    return undefined;
  }

  const maxWidth = Math.max(
    MIN_MEASURE_WIDTH,
    Math.floor(options.containerWidth),
  );
  const prepared = prepareInlineFlow(items);
  const measured = measureInlineFlow(prepared, maxWidth, lineHeight);
  const minimumHeight = Math.max(
    minimumInlineHeight,
    message.badges?.length ? badgeSize : 0,
  );

  return (
    prelineHeight +
    Math.max(minimumHeight, measured.height) +
    ROW_VERTICAL_PADDING +
    ESTIMATE_HEIGHT_GUARD
  );
}

function measureReplyContextHeight(
  replyText: string,
  lineHeight: number,
  style: TextStyle,
  compact: boolean,
  containerWidth: number,
): number {
  const maxWidth = Math.max(MIN_MEASURE_WIDTH, Math.floor(containerWidth));

  const items = [
    {
      text: replyText,
      style,
      atomic: compact,
    },
  ];

  const prepared = prepareInlineFlow(items);
  const measured = measureInlineFlow(prepared, maxWidth, lineHeight);
  return measured.height;
}

function isEstimableChatMessage(message: AnyChatMessageType): boolean {
  if (message.isAnnouncement || message.isHighlightedMessage) {
    return message.message.every(isEstimablePart);
  }

  if (
    message.isTwitchSystemNotice ||
    message.isSpecialNotice ||
    message.sender?.toLowerCase() === 'system' ||
    ('notice_tags' in message && message.notice_tags)
  ) {
    return false;
  }

  return message.message.every(isEstimablePart);
}

function isEstimablePart(part: ParsedPart): boolean {
  return (
    part.type === 'text' ||
    part.type === 'mention' ||
    part.type === 'emote' ||
    part.type === 'stvEmote' ||
    part.type === 'twitchClip' ||
    ('content' in part && typeof part.content === 'string')
  );
}

function getEstimatedEmoteSize(
  part: ParsedPart<'emote'> | ParsedPart<'stvEmote'>,
  targetSize: number,
): { height: number; width: number } {
  const sourceWidth = part.width || 20;
  const sourceHeight = part.height || 20;
  const aspectRatio =
    part.aspect_ratio || (sourceHeight > 0 ? sourceWidth / sourceHeight : 1);

  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { height: targetSize, width: targetSize };
  }

  return {
    height: targetSize,
    width: Math.max(1, Math.round(targetSize * aspectRatio)),
  };
}

function getMessagePartsFingerprint(
  message: AnyChatMessageType['message'],
): string {
  return message
    .map(part => {
      switch (part.type) {
        case 'text':
          return `t${part.content.length}`;
        case 'mention':
          return `m${part.content.length}`;
        case 'emote':
          return `e${part.zero_width ? 'z' : 'n'}${part.width ?? 0}x${part.height ?? 0}`;
        case 'stvEmote':
          return `s${part.zero_width ? 'z' : 'n'}${part.width ?? 0}x${part.height ?? 0}`;
        case 'twitchClip':
          return 'c';
        default:
          return part.type.slice(0, 1);
      }
    })
    .join(',');
}

function getCacheKey(
  message: AnyChatMessageType,
  options: PretextChatHeightOptions,
): string {
  const widthBucket = Math.round(options.containerWidth);
  return [
    message.id,
    widthBucket,
    options.density,
    options.showInlineReplyContext ? 'reply-context' : 'no-reply-context',
    options.showTimestamp ? 'ts' : 'no-ts',
    getMessagePartsFingerprint(message.message),
    `badges:${message.badges?.length ?? 0}`,
    options.showInlineReplyContext && message.parentDisplayName ? 'reply' : '',
    message.moderationNotice ? `mod:${message.moderationNotice.length}` : '',
    message.isAnnouncement ? 'ann' : '',
    message.isHighlightedMessage ? 'hl' : '',
    message.isSharedChatDuplicated ? 'shared' : '',
    message.isChannelPointRedemption ? 'cp' : '',
    message.userstate['first-msg'] || '',
  ].join('|');
}

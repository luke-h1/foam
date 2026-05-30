import { theme } from '@app/styles/themes';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import {
  measureInlineFlow,
  prepareInlineFlow,
  type InlineFlowItem,
  type TextStyle,
} from './expoPretext';

import type { AnyChatMessageType } from './messageHandlers';

const COMPACT_LINE_HEIGHT = 14;
const COMPACT_FONT_SIZE = theme.fontSize11;
const COMFORTABLE_LINE_HEIGHT = 17;
const COMFORTABLE_FONT_SIZE = theme.fontSize14;
const ROW_VERTICAL_PADDING = 2;
const MIN_MEASURE_WIDTH = 80;
const NON_BREAKING_SPACE = '\u00A0';
const HEIGHT_CACHE_LIMIT = 2000;

const heightCache = new Map<string, number>();

export interface PretextChatHeightOptions {
  containerWidth: number;
  density: 'comfortable' | 'compact';
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
  if (!isPlainEstimableChatMessage(message)) {
    return undefined;
  }

  const { density, showTimestamp } = options;
  const compact = density === 'compact';
  const fontSize = compact ? COMPACT_FONT_SIZE : COMFORTABLE_FONT_SIZE;
  const lineHeight = compact ? COMPACT_LINE_HEIGHT : COMFORTABLE_LINE_HEIGHT;
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

  if (message.userstate['first-msg'] === '1') {
    items.push({
      text: 'first-msg ',
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

    return undefined;
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
    lineHeight,
    message.badges?.length ? badgeSize : 0,
  );

  return Math.max(minimumHeight, measured.height) + ROW_VERTICAL_PADDING;
}

function isPlainEstimableChatMessage(message: AnyChatMessageType): boolean {
  if (
    message.isTwitchSystemNotice ||
    message.isSpecialNotice ||
    message.isChannelPointRedemption ||
    message.sender?.toLowerCase() === 'system' ||
    message.parentDisplayName ||
    message.replyBody ||
    ('notice_tags' in message && message.notice_tags)
  ) {
    return false;
  }

  return message.message.every(isEstimablePart);
}

function isEstimablePart(part: ParsedPart): boolean {
  return part.type === 'text' || part.type === 'mention';
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
    options.showTimestamp ? 'ts' : 'no-ts',
    message.message.length,
  ].join('|');
}

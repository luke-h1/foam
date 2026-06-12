import { theme } from '@app/styles/themes';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { PixelRatio } from 'react-native';
import {
  getChatLineMetrics,
  type ChatFontScale,
} from '../components/ChatMessage/RichChatMessage.styles';
import {
  measureInlineFlow,
  measureNaturalWidth,
  prepareInlineFlow,
  prepareWithSegments,
  type InlineFlowItem,
  type TextStyle,
} from './expoPretext';

import { canRenderMessageInline } from './canRenderMessageInline';
import { hasSharedChannelPointsMessage } from './channelPointsSharedMessage';
import type { AnyChatMessageType } from './messageHandlers';

/**
 *  Inline emote messages render the whole Text at the emote line height
 *  (messageTextEmoteLine / messageTextEmoteLineCompact in
 *  RichChatMessage.styles.ts), so every wrapped line is this tall.
 */
const COMPACT_EMOTE_LINE_HEIGHT = 30;
const COMFORTABLE_EMOTE_LINE_HEIGHT = 34;
const ROW_VERTICAL_PADDING = 6;
const MIN_MEASURE_WIDTH = 80;
const HEIGHT_CACHE_LIMIT = 2000;
const COMPACT_EMOTE_SIZE = 26;
const COMFORTABLE_EMOTE_SIZE = 30;
const ZERO_WIDTH_EMOTE_REMAINING_WIDTH_RATIO = 0.28;
const SHARED_CHAT_LABEL_HEIGHT = 18;
const SURFACE_VERTICAL_PADDING = 8;
const SURFACE_VERTICAL_MARGIN = 4;

/**
 * Badge images sit on the text baseline, so a line holding an 18pt badge on
 * a 17pt lineHeight grows to badge height + font descent (~22pt). Descent
 * approximated as a quarter of the font size (Montserrat descent ratio is
 * 0.251).
 */
const FONT_DESCENT_RATIO = 0.25;

/**
 * Chat rows render in the app's Montserrat faces (ui/Text resolves
 * theme.fontFamily*), not the system font. Measuring with the system font
 * undercounts line wraps because Montserrat runs wider per glyph. The
 * 'System' fallback covers the startup window before expo-font registers
 * the faces (expo-pretext picks the first loaded family).
 */
const BODY_FONT_FAMILY = [theme.fontFamilyRegular, 'System'];
const BOLD_FONT_FAMILY = [theme.fontFamilyBold, 'System'];

/**
 * ui/Text caps Dynamic Type at maxFontSizeMultiplier={1.4}; rendered font
 * sizes and lineHeights both scale by min(system font scale, 1.4).
 */
const MAX_FONT_SIZE_MULTIPLIER = 1.4;

/**
 * Atomic image placeholders (badges, emotes) need a non-collapsible glyph
 * to survive prepareInlineFlow \u2014 zero-width characters measure 0pt wide and
 * get dropped entirely. Use NBSP and subtract its measured advance from the
 * item's extraWidth so the item occupies exactly the rendered image width.
 */
const IMAGE_PLACEHOLDER = '\u00A0';

const placeholderAdvanceCache = new Map<string, number>();

function getPlaceholderAdvance(style: TextStyle): number {
  const key = `${style.fontFamily}|${style.fontSize}|${style.fontWeight ?? '400'}`;
  let advance = placeholderAdvanceCache.get(key);
  if (advance === undefined) {
    advance = measureNaturalWidth(
      prepareWithSegments(IMAGE_PLACEHOLDER, style),
    );
    placeholderAdvanceCache.set(key, advance);
  }
  return advance;
}

/**
 * Twitch clip parts render a MediaLinkCard (50pt thumbnail frame + border
 * and 4pt vertical margins) on its own flex line.
 */
const CLIP_CARD_BLOCK_HEIGHT = 59;

// styles.timestamp / timestampCompact in RichChatMessage.styles.ts
const COMPACT_TIMESTAMP_FONT_SIZE = 10;

// styles.badge / badgeCompact: image size + marginRight.
const COMFORTABLE_BADGE_SIZE = 18;
const COMPACT_BADGE_SIZE = 14;
const BADGE_MARGIN_RIGHT = 4;

// styles.mention / mentionCompact marginHorizontal, both edges.
const COMFORTABLE_MENTION_MARGIN = 4;
const COMPACT_MENTION_MARGIN = 2;

// ReplyingToHeader renders a single numberOfLines={1} row: replyContextText
// lineHeight (15 / 14 compact) plus the replyContextRow marginBottom.
const COMFORTABLE_REPLY_CONTEXT_LINE_HEIGHT = 15;
const COMPACT_REPLY_CONTEXT_LINE_HEIGHT = 14;

// styles.messageMetaText / messageMetaTextCompact + messageMetaRow
// marginBottom — the "First time chat" / announcement / highlight label row.
const COMFORTABLE_META_LINE_HEIGHT = 15;
const COMPACT_META_LINE_HEIGHT = 14;
const META_ROW_MARGIN_BOTTOM = 4;

const heightCache = new Map<string, number>();

export interface PretextChatHeightOptions {
  containerWidth: number;
  density: 'comfortable' | 'compact';
  fontScale?: ChatFontScale;
  showInlineReplyContext: boolean;
  showTimestamp: boolean;
}

function getFontSizeMultiplier(): number {
  return Math.min(PixelRatio.getFontScale(), MAX_FONT_SIZE_MULTIPLIER);
}

export function estimateChatMessageHeightWithPretext(
  message: AnyChatMessageType | undefined,
  options: PretextChatHeightOptions,
): number | undefined {
  if (!message || options.containerWidth < MIN_MEASURE_WIDTH) {
    return undefined;
  }

  const fontSizeMultiplier = getFontSizeMultiplier();
  const cacheKey = getCacheKey(message, options, fontSizeMultiplier);
  const cached = heightCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const measured = measureChatMessageHeight(
    message,
    options,
    fontSizeMultiplier,
  );
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

interface InlineFlowContext {
  compact: boolean;
  emoteSize: number;
  showTimestamp: boolean;
  textStyle: TextStyle;
  timestampStyle: TextStyle;
  usernameStyle: TextStyle;
}

function measureChatMessageHeight(
  message: AnyChatMessageType,
  options: PretextChatHeightOptions,
  fontSizeMultiplier: number,
): number | undefined {
  if (!isEstimableChatMessage(message)) {
    return undefined;
  }

  const { density, fontScale, showTimestamp } = options;
  const compact = density === 'compact';
  const baseMetrics = getChatLineMetrics(fontScale, compact);
  const lineHeight = baseMetrics.lineHeight * fontSizeMultiplier;
  const textStyle: TextStyle = {
    fontFamily: BODY_FONT_FAMILY,
    fontSize: baseMetrics.fontSize * fontSizeMultiplier,
    lineHeight,
    fontWeight: '400',
  };
  const usernameStyle: TextStyle = {
    ...textStyle,
    fontFamily: BOLD_FONT_FAMILY,
    fontWeight: '700',
  };
  // ui/Text variant='mono' maps to fontFamily 'monospace', which iOS lacks,
  // so the rendered timestamp falls back to the system font in bold.
  const timestampStyle: TextStyle = {
    fontFamily: 'System',
    fontSize:
      (compact ? COMPACT_TIMESTAMP_FONT_SIZE : theme.fontSize11) *
      fontSizeMultiplier,
    lineHeight,
    fontWeight: '700',
  };

  const { prelineHeight, verticalChrome } = measureRowChrome(
    message,
    options,
    fontSizeMultiplier,
    compact,
  );
  const { items, minimumInlineHeight } = buildInlineFlowItems(message, {
    compact,
    emoteSize: compact ? COMPACT_EMOTE_SIZE : COMFORTABLE_EMOTE_SIZE,
    showTimestamp,
    textStyle,
    timestampStyle,
    usernameStyle,
  });

  if (items.length === 0) {
    return undefined;
  }

  const maxWidth = Math.max(
    MIN_MEASURE_WIDTH,
    Math.floor(options.containerWidth),
  );
  // Inline emote messages render as one Text with the taller emote
  // lineHeight applied to every wrapped line, so measure with that height
  // or emote-heavy rows come out a line short and the list clips them.
  // Paint status isn't known here; painted senders fall back to the
  // flex-wrap path, where this is still a close estimate.
  const rendersInlineEmoteLine =
    message.message.some(part => part.type === 'emote') &&
    canRenderMessageInline(message.message, {
      hasPaint: false,
      isModerated: Boolean(message.moderationNotice),
    });
  const emoteLineHeight =
    (compact ? COMPACT_EMOTE_LINE_HEIGHT : COMFORTABLE_EMOTE_LINE_HEIGHT) *
    fontSizeMultiplier;
  const flowLineHeight = rendersInlineEmoteLine ? emoteLineHeight : lineHeight;
  const prepared = prepareInlineFlow(items);
  const measured = measureInlineFlow(prepared, maxWidth, flowLineHeight);
  const contentHeight = measured.height;

  // The badge line: badges sit on the baseline, so the line holding them
  // renders at badge height + descent when that exceeds the line's height
  // (the flow line height, or the tallest inline image on the line).
  const badgeSize = compact ? COMPACT_BADGE_SIZE : COMFORTABLE_BADGE_SIZE;
  const fontDescent = Math.ceil(
    baseMetrics.fontSize * fontSizeMultiplier * FONT_DESCENT_RATIO,
  );
  const badgeLineExtra = message.badges?.length
    ? Math.max(
        0,
        badgeSize + fontDescent - Math.max(flowLineHeight, minimumInlineHeight),
      )
    : 0;

  const minimumHeight = Math.max(minimumInlineHeight, lineHeight);

  return (
    prelineHeight +
    Math.max(minimumHeight, contentHeight) +
    badgeLineExtra +
    verticalChrome
  );
}

/**
 * Height of everything above the message line (reply quote, notice labels)
 * plus the row's vertical padding/margin, which notice surfaces replace
 * with a taller variant (see the RichChatMessageContainer style merge).
 */
function measureRowChrome(
  message: AnyChatMessageType,
  options: PretextChatHeightOptions,
  fontSizeMultiplier: number,
  compact: boolean,
): { prelineHeight: number; verticalChrome: number } {
  const metaRowHeight =
    (compact ? COMPACT_META_LINE_HEIGHT : COMFORTABLE_META_LINE_HEIGHT) *
      fontSizeMultiplier +
    META_ROW_MARGIN_BOTTOM;
  let prelineHeight = 0;

  if (
    options.showInlineReplyContext &&
    (message.parentDisplayName || message.replyBody)
  ) {
    // Never wrapped: the reply quote is a single numberOfLines={1} line no
    // matter how long replyBody is.
    prelineHeight +=
      (compact
        ? COMPACT_REPLY_CONTEXT_LINE_HEIGHT
        : COMFORTABLE_REPLY_CONTEXT_LINE_HEIGHT) *
        fontSizeMultiplier +
      META_ROW_MARGIN_BOTTOM;
  }

  const isFirstMessage = message.userstate['first-msg'] === '1';
  if (isFirstMessage) {
    prelineHeight += metaRowHeight;
  }

  if (
    message.isAnnouncement ||
    message.isHighlightedMessage ||
    (message.isChannelPointRedemption &&
      hasSharedChannelPointsMessage(message.message))
  ) {
    prelineHeight += metaRowHeight;
  }

  if (message.isSharedChatDuplicated) {
    prelineHeight += SHARED_CHAT_LABEL_HEIGHT;
  }

  if (message.isSharedChatDuplicated || message.moderationNotice) {
    prelineHeight += SURFACE_VERTICAL_PADDING;
  }

  const rendersNoticeSurface =
    isFirstMessage ||
    message.isAnnouncement ||
    message.isHighlightedMessage ||
    message.isChannelPointRedemption;

  return {
    prelineHeight,
    verticalChrome: rendersNoticeSurface
      ? SURFACE_VERTICAL_PADDING + SURFACE_VERTICAL_MARGIN
      : ROW_VERTICAL_PADDING,
  };
}

function buildInlineFlowItems(
  message: AnyChatMessageType,
  context: InlineFlowContext,
): { items: InlineFlowItem[]; minimumInlineHeight: number } {
  const { compact, showTimestamp, textStyle, timestampStyle, usernameStyle } =
    context;
  const items: InlineFlowItem[] = [];
  let minimumInlineHeight = 0;

  if (showTimestamp && message.timestamp) {
    items.push({
      text: `${message.timestamp} `,
      style: timestampStyle,
      atomic: true,
    });
  }

  const badgeSize = compact ? COMPACT_BADGE_SIZE : COMFORTABLE_BADGE_SIZE;
  const placeholderAdvance = getPlaceholderAdvance(textStyle);
  for (let index = 0; index < (message.badges?.length ?? 0); index += 1) {
    items.push({
      text: IMAGE_PLACEHOLDER,
      style: textStyle,
      atomic: true,
      extraWidth: Math.max(
        0,
        badgeSize + BADGE_MARGIN_RIGHT - placeholderAdvance,
      ),
    });
  }

  const username = message.userstate.username || message.sender;
  if (username) {
    items.push({
      text: `${username}: `,
      style: usernameStyle,
      atomic: true,
    });
  }

  for (const part of message.message) {
    minimumInlineHeight = Math.max(
      minimumInlineHeight,
      appendMessagePartItem(items, part, context),
    );
  }

  return { items, minimumInlineHeight };
}

/**
 * Append the flow item for one message part; returns the minimum inline
 * height the part needs (0 when the line height already covers it).
 */
function appendMessagePartItem(
  items: InlineFlowItem[],
  part: ParsedPart,
  context: InlineFlowContext,
): number {
  const { compact, emoteSize, textStyle } = context;

  switch (part.type) {
    case 'text':
      items.push({ text: part.content, style: textStyle });
      return 0;

    case 'mention':
      // Mentions render at the regular weight (styles.mention) with
      // marginHorizontal on both edges.
      items.push({
        text: part.content,
        style: textStyle,
        extraWidth: compact
          ? COMPACT_MENTION_MARGIN
          : COMFORTABLE_MENTION_MARGIN,
      });
      return 0;

    case 'stvEmote':
      items.push({
        text: IMAGE_PLACEHOLDER,
        style: textStyle,
        atomic: true,
        extraWidth: Math.max(0, 120 - getPlaceholderAdvance(textStyle)),
      });
      return 28;

    case 'emote': {
      const { width, height } = getEstimatedEmoteSize(part, emoteSize);
      const occupiedWidth = part.zero_width
        ? Math.round(width * ZERO_WIDTH_EMOTE_REMAINING_WIDTH_RATIO)
        : width;
      items.push({
        text: IMAGE_PLACEHOLDER,
        style: textStyle,
        atomic: true,
        extraWidth: Math.max(
          0,
          occupiedWidth - getPlaceholderAdvance(textStyle),
        ),
      });
      return height;
    }

    case 'twitchClip':
      // Renders a MediaLinkCard on its own flex line (flexBasis '100%'),
      // replacing the URL text entirely.
      return CLIP_CARD_BLOCK_HEIGHT;

    default:
      if ('content' in part && part.content) {
        items.push({ text: part.content, style: textStyle });
      }
      return 0;
  }
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
  fontSizeMultiplier: number,
): string {
  const widthBucket = Math.round(options.containerWidth);
  return [
    message.id,
    widthBucket,
    options.density,
    options.fontScale ?? 'default',
    `fsm${Math.round(fontSizeMultiplier * 100)}`,
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

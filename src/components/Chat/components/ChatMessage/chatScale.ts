import { theme } from '@app/styles/themes';

export type ChatDensity = 'comfortable' | 'compact';
import type { ChatFontScale } from '@app/store/preferenceStore';

export type { ChatFontScale };

/**
 * Body font size follows the font-scale preference alone; density never
 * touches it - a compact row is the same size, only tighter.
 */
const BASE_FONT_SIZE = {
  small: theme.fontSize12,
  default: theme.fontSize14,
  large: theme.fontSize16,
} satisfies Record<ChatFontScale, number>;

/**
 * Density moves leading and row padding. Comfortable matches the 1.5 ratio
 * the 7TV extension locks its chat list to.
 */
const LINE_HEIGHT_RATIO = {
  comfortable: 1.5,
  compact: 1.3,
} satisfies Record<ChatDensity, number>;

const ROW_PADDING_VERTICAL = {
  comfortable: 5,
  compact: 2,
} satisfies Record<ChatDensity, number>;

const ROW_PADDING_HORIZONTAL = {
  comfortable: 8,
  compact: 6,
} satisfies Record<ChatDensity, number>;

const SECONDARY_FONT_RATIO = 0.86;
const EMOTE_RATIO = 2.15;
const EMOTE_HEADROOM_RATIO = 0.3;
const REPLY_EMOTE_RATIO = 1.43;
const BADGE_RATIO = 1.28;
const GAP_RATIO = 0.29;
const SURFACE_PADDING_HORIZONTAL_RATIO = 0.57;
const SURFACE_PADDING_VERTICAL_RATIO = 0.29;

export interface ChatScale {
  badgeGap: number;
  badgeSize: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  emoteLineHeight: number;
  emoteSize: number;
  gap: number;
  metaIconSize: number;
  replyEmoteLineHeight: number;
  replyEmoteSize: number;
  rowPaddingHorizontal: number;
  rowPaddingVertical: number;
  secondaryFontSize: number;
  secondaryLineHeight: number;
  surfacePaddingHorizontal: number;
  surfacePaddingVertical: number;
}

/**
 * Neutral chrome shared by every chat surface; `muted` is the one secondary
 * text colour instead of per-surface rgba literals.
 */
export const CHAT_SURFACE_COLORS = {
  accentBarWidth: 2,
  alternatingRow: 'rgba(255, 255, 255, 0.03)',
  muted: theme.color.notice.muted,
  pressed: 'rgba(153, 153, 153, 0.24)',
  radius: theme.borderRadius4,
  strike: theme.color.notice.muted,
} as const;

function buildChatScale(
  fontScale: ChatFontScale,
  density: ChatDensity,
): ChatScale {
  const bodyFontSize = BASE_FONT_SIZE[fontScale];
  const ratio = LINE_HEIGHT_RATIO[density];
  const secondaryFontSize = Math.round(bodyFontSize * SECONDARY_FONT_RATIO);
  const emoteSize = Math.round(bodyFontSize * EMOTE_RATIO);
  const replyEmoteSize = Math.round(bodyFontSize * REPLY_EMOTE_RATIO);
  const emoteHeadroom = Math.round(bodyFontSize * EMOTE_HEADROOM_RATIO);

  return {
    badgeGap: Math.round(bodyFontSize * GAP_RATIO),
    badgeSize: Math.round(bodyFontSize * BADGE_RATIO),
    bodyFontSize,
    bodyLineHeight: Math.round(bodyFontSize * ratio),
    emoteLineHeight: emoteSize + emoteHeadroom,
    emoteSize,
    gap: Math.round(bodyFontSize * GAP_RATIO),
    metaIconSize: secondaryFontSize,
    replyEmoteLineHeight: replyEmoteSize + emoteHeadroom,
    replyEmoteSize,
    rowPaddingHorizontal: ROW_PADDING_HORIZONTAL[density],
    rowPaddingVertical: ROW_PADDING_VERTICAL[density],
    secondaryFontSize,
    secondaryLineHeight: Math.round(secondaryFontSize * ratio),
    surfacePaddingHorizontal: Math.round(
      bodyFontSize * SURFACE_PADDING_HORIZONTAL_RATIO,
    ),
    surfacePaddingVertical: Math.round(
      bodyFontSize * SURFACE_PADDING_VERTICAL_RATIO,
    ),
  };
}

const CHAT_SCALES = {
  small: {
    comfortable: buildChatScale('small', 'comfortable'),
    compact: buildChatScale('small', 'compact'),
  },
  default: {
    comfortable: buildChatScale('default', 'comfortable'),
    compact: buildChatScale('default', 'compact'),
  },
  large: {
    comfortable: buildChatScale('large', 'comfortable'),
    compact: buildChatScale('large', 'compact'),
  },
} satisfies Record<ChatFontScale, Record<ChatDensity, ChatScale>>;

/**
 * Resolved chat metrics for a preference pair. Renderers must use these, never
 * local literals, so density and font scale cannot drift apart.
 */
export function getChatScale(
  fontScale: ChatFontScale | undefined,
  density: ChatDensity,
): ChatScale {
  return CHAT_SCALES[fontScale ?? 'default'][density];
}

export interface ChatLineMetrics {
  fontSize: number;
  lineHeight: number;
}

/**
 * Default-font-scale body metrics per density, for surfaces that size
 * themselves outside a React render and cannot read the live preference.
 */
export const chatLineMetrics = {
  comfortable: {
    fontSize: getChatScale('default', 'comfortable').bodyFontSize,
    lineHeight: getChatScale('default', 'comfortable').bodyLineHeight,
  },
  compact: {
    fontSize: getChatScale('default', 'compact').bodyFontSize,
    lineHeight: getChatScale('default', 'compact').bodyLineHeight,
  },
} as const satisfies Record<ChatDensity, ChatLineMetrics>;

export function densityFromCompact(compact: boolean | undefined): ChatDensity {
  return compact ? 'compact' : 'comfortable';
}

import { theme } from '@app/styles/themes';

export type ChatDensity = 'comfortable' | 'compact';
export type ChatFontScale = 'small' | 'default' | 'large';

/**
 * Body font size is a function of the font-scale preference alone. Density
 * deliberately does not touch it, so a compact row is the same typeface at the
 * same size as a comfortable one - only tighter.
 */
const BASE_FONT_SIZE: Record<ChatFontScale, number> = {
  small: theme.fontSize12,
  default: theme.fontSize14,
  large: theme.fontSize16,
};

/**
 * Density moves leading and row padding. Comfortable matches the 1.5 ratio the
 * 7TV extension locks its chat list to; compact tightens it without changing
 * any other part of the ramp.
 */
const LINE_HEIGHT_RATIO: Record<ChatDensity, number> = {
  comfortable: 1.5,
  compact: 1.3,
};

const ROW_PADDING_VERTICAL: Record<ChatDensity, number> = {
  comfortable: 5,
  compact: 2,
};

const ROW_PADDING_HORIZONTAL: Record<ChatDensity, number> = {
  comfortable: 8,
  compact: 6,
};

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
 * Neutral chrome shared by every chat surface. `muted` is the single secondary
 * text colour - timestamps, reply context, meta rows and moderated bodies all
 * resolve to it rather than to their own rgba literals.
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

const CHAT_SCALES: Record<ChatFontScale, Record<ChatDensity, ChatScale>> = {
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
};

/**
 * The resolved chat metrics for a preference pair. Every value the renderer
 * uses must come from here rather than a local literal, so density and font
 * scale cannot drift apart.
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
 * The default-font-scale body metrics per density, for the surfaces that size
 * themselves outside a React render - the painted-username rasterizers and the
 * chat bench - and so cannot resolve a live font-scale preference.
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

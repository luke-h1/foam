import {
  type ImageStyle,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { theme } from '@app/styles/themes';

import {
  CHAT_SURFACE_COLORS,
  type ChatDensity,
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from './chatScale';

export interface ChatTextStyles {
  badge: ImageStyle;
  body: TextStyle;
  /**
   * Lines carrying an inline emote need the taller emote line height on every
   * nested span: TextKit sizes a wrapped line from the paragraph style of the
   * spans on it, so applying it only to the outer Text clips the attachment.
   */
  bodyEmoteLine: TextStyle;
  link: TextStyle;
  mention: TextStyle;
  meta: TextStyle;
  metaStrong: TextStyle;
  placeholder: ViewStyle;
  replyContext: TextStyle;
  replyContextEmoteLine: TextStyle;
  row: ViewStyle;
  surface: ViewStyle;
  timestamp: TextStyle;
  username: TextStyle;
}

function buildChatTextStyles(
  fontScale: ChatFontScale,
  density: ChatDensity,
): ChatTextStyles {
  const scale = getChatScale(fontScale, density);
  const body: TextStyle = {
    fontSize: scale.bodyFontSize,
    lineHeight: scale.bodyLineHeight,
  };
  const secondary: TextStyle = {
    color: CHAT_SURFACE_COLORS.muted,
    fontSize: scale.secondaryFontSize,
    lineHeight: scale.secondaryLineHeight,
  };

  return StyleSheet.create<ChatTextStyles>({
    badge: {
      height: scale.badgeSize,
      marginRight: scale.badgeGap,
      width: scale.badgeSize,
    },
    body,
    bodyEmoteLine: {
      lineHeight: scale.emoteLineHeight,
    },
    link: {
      ...body,
      color: theme.color.brand.twitch,
      textDecorationLine: 'underline',
    },
    mention: body,
    meta: secondary,
    metaStrong: {
      fontWeight: '600',
    },
    placeholder: {
      borderRadius: CHAT_SURFACE_COLORS.radius,
      height: Math.round(scale.bodyFontSize * 0.86),
      marginHorizontal: 2,
      width: Math.round(scale.bodyFontSize * 6.9),
    },
    replyContext: secondary,
    replyContextEmoteLine: {
      lineHeight: scale.replyEmoteLineHeight,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      minHeight: 0,
      paddingHorizontal: scale.rowPaddingHorizontal,
      paddingVertical: scale.rowPaddingVertical,
      width: '100%',
    },
    surface: {
      borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
      marginVertical: 2,
      paddingHorizontal: scale.surfacePaddingHorizontal,
      paddingVertical: scale.surfacePaddingVertical,
    },
    timestamp: {
      ...secondary,
      letterSpacing: -0.3,
      marginRight: scale.gap,
    },
    username: {
      ...body,
      fontWeight: '700',
    },
  });
}

const FONT_SCALES: ChatFontScale[] = ['small', 'default', 'large'];
const DENSITIES: ChatDensity[] = ['comfortable', 'compact'];

const CHAT_TEXT_STYLES = Object.fromEntries(
  FONT_SCALES.map(fontScale => [
    fontScale,
    Object.fromEntries(
      DENSITIES.map(density => [
        density,
        buildChatTextStyles(fontScale, density),
      ]),
    ) as Record<ChatDensity, ChatTextStyles>,
  ]),
) as Record<ChatFontScale, Record<ChatDensity, ChatTextStyles>>;

/**
 * Resolved text styles for a preference pair. Every scale-dependent style in
 * the chat render path comes from here, so a row cannot pick up the body size
 * without also picking up the matching leading, emote size and padding.
 */
export function getChatTextStyles(
  fontScale: ChatFontScale | undefined,
  compact: boolean | undefined,
): ChatTextStyles {
  return CHAT_TEXT_STYLES[fontScale ?? 'default'][densityFromCompact(compact)];
}

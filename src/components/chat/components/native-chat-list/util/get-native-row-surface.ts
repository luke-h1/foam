import { StyleSheet, type ViewStyle } from 'react-native';

import { styles } from '@app/components/chat/components/chat-message/chat-row.styles';
import { getChatTextStyles } from '@app/components/chat/components/chat-message/chat-text.styles';
import { getChatRowSurfaceStyle } from '@app/components/chat/components/chat-message/util/get-chat-row-surface-style';
import type { NativeChatRowSurface } from '@modules/native-chat-list/src/NativeChatList.types';

import type { NativeRowFacts } from './get-native-row-facts';
import type { NativeChatRowContext } from './native-row-context';
import { parseStyleNumber, parseStyleString } from './parse-style-value';

type StvEventKind = 'added' | 'removed' | null;

/**
 * A 7TV emote event draws its own bordered box inside the row. The native row
 * has one surface, so the box's colours and padding merge into it.
 */
function getStvEventStyle(stvEvent: StvEventKind) {
  if (!stvEvent) {
    return null;
  }

  return [
    styles.stvEmoteNoticeSurface,
    stvEvent === 'added'
      ? styles.stvEmoteAddedSurface
      : styles.stvEmoteRemovedSurface,
  ];
}

/**
 * The row container style a React row gets from `ChatRowSurface`, flattened
 * into the numbers the native cell draws.
 */
export function getNativeRowSurface(
  facts: NativeRowFacts,
  context: NativeChatRowContext,
  stvEvent: StvEventKind,
): NativeChatRowSurface {
  const surfaceStyle = getChatRowSurfaceStyle({
    ...facts,
    style: getChatTextStyles(context.fontScale, context.compact).row,
  });

  const flat: ViewStyle = StyleSheet.flatten<ViewStyle>(surfaceStyle) ?? {};

  const stv: ViewStyle =
    StyleSheet.flatten<ViewStyle>(getStvEventStyle(stvEvent)) ?? {};

  const padding = (
    side: 'Bottom' | 'Left' | 'Right' | 'Top',
    source: ViewStyle,
  ) => {
    const axis =
      side === 'Left' || side === 'Right'
        ? source.paddingHorizontal
        : source.paddingVertical;

    return (
      parseStyleNumber(source[`padding${side}`]) ??
      parseStyleNumber(axis) ??
      parseStyleNumber(source.padding) ??
      0
    );
  };

  const stvBorderWidth = parseStyleNumber(stv.borderLeftWidth) ?? 0;

  return {
    backgroundColor:
      parseStyleString(stv.backgroundColor) ??
      parseStyleString(flat.backgroundColor),
    borderLeftColor:
      parseStyleString(stv.borderLeftColor) ??
      parseStyleString(flat.borderLeftColor),
    borderLeftWidth: Math.max(
      parseStyleNumber(flat.borderLeftWidth) ?? 0,
      stvBorderWidth,
    ),
    marginVertical:
      (parseStyleNumber(flat.marginVertical) ?? 0) +
      (parseStyleNumber(stv.marginVertical) ?? 0),
    paddingBottom: padding('Bottom', flat) + padding('Bottom', stv),
    paddingLeft: padding('Left', flat) + padding('Left', stv),
    paddingRight: padding('Right', flat) + padding('Right', stv),
    paddingTop: padding('Top', flat) + padding('Top', stv),
  };
}

import { StyleSheet, type TextStyle } from 'react-native';

import {
  getFontFamily,
  resolveWeightFromFontWeight,
  sizeStyles,
  typeDefaults,
} from '@app/components/ui/text/text.styles';
import { resolveThemeColor } from '@app/styles/themes';
import type { NativeChatTextStyle } from '@modules/native-chat-list/src/NativeChatList.types';

import { parseStyleNumber, parseStyleString } from './parse-style-value';

export type NativeTextStyleEntry = TextStyle | false | null | undefined;

/**
 * `ChatText` defaults to `gray`; message text passes `gray.text`.
 */
export type NativeTextBaseColor = 'gray' | 'gray.text';

const objectIds = new WeakMap<TextStyle, number>();
const indexByKey = new Map<string, number>();
const table: NativeChatTextStyle[] = [];
let nextObjectId = 1;

function getObjectId(style: TextStyle): number {
  const existing = objectIds.get(style);

  if (existing !== undefined) {
    return existing;
  }

  const id = nextObjectId;
  nextObjectId += 1;
  objectIds.set(style, id);
  return id;
}

/**
 * Resolves the way `ChatText` does: a `fontWeight` picks the brand font file
 * for that weight, and the colour falls back to the `ChatText` default.
 */
function toNativeTextStyle(
  entries: readonly NativeTextStyleEntry[],
  base: NativeTextBaseColor,
): NativeChatTextStyle {
  const flat: TextStyle = StyleSheet.flatten(entries.filter(Boolean)) ?? {};
  const decoration = flat.textDecorationLine ?? 'none';

  const weight =
    resolveWeightFromFontWeight(flat.fontWeight) ?? typeDefaults.callout.weight;

  return {
    color:
      parseStyleString(flat.color) ??
      resolveThemeColor(base, { contrast: base === 'gray' }),
    fontFamily: getFontFamily('default', weight, flat.fontStyle === 'italic'),
    fontSize: flat.fontSize ?? sizeStyles.callout.fontSize,
    letterSpacing: flat.letterSpacing ?? 0,
    lineHeight: flat.lineHeight ?? sizeStyles.callout.lineHeight,
    opacity: parseStyleNumber(flat.opacity) ?? 1,
    strikethrough: decoration.includes('line-through'),
    underline: decoration.includes('underline'),
  };
}

/**
 * Returns the table index for a list of `StyleSheet` entries. The key is the
 * identity of each entry, so pass only static styles and send per-span
 * colours through `NativeChatSpan.color`.
 */
export function resolveNativeTextStyle(
  entries: readonly NativeTextStyleEntry[],
  base: NativeTextBaseColor = 'gray',
): number {
  let key: string = base;

  for (const entry of entries) {
    if (entry) {
      key += `|${getObjectId(entry)}`;
    }
  }

  const existing = indexByKey.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const index = table.length;
  table.push(toNativeTextStyle(entries, base));
  indexByKey.set(key, index);
  return index;
}

export function getNativeTextStyle(index: number): NativeChatTextStyle {
  const style = table[index];

  if (!style) {
    throw new Error(`Unknown native text style ${index}`);
  }

  return style;
}

/**
 * The table only grows, so its length tells the sync hook whether the native
 * list already has every style a batch refers to.
 */
export function getNativeTextStyleTable(): readonly NativeChatTextStyle[] {
  return table;
}

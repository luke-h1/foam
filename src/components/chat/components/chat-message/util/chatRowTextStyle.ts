import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import {
  getChatTextStyle,
  getStyleWeightOverride,
} from '@app/components/chat/components/chat-text/util/chatTextStyle';
import {
  findStyleValue,
  resolveWeightFromFontWeight,
} from '@app/components/ui/text/Text.styles';

/**
 * The `ChatText` props a row span uses: `muted` is the default `gray`,
 * `text` is `color='gray.text'` and `tabular` is `tabular` on `gray`.
 */
export type ChatRowTextTone = 'muted' | 'text' | 'tabular';

export type ChatRowTextPart = TextStyle | false | null | undefined;

const toneStyles = {
  muted: getChatTextStyle({
    align: 'left',
    color: 'gray',
    contrast: undefined,
    family: 'brand',
    highContrast: undefined,
    italic: undefined,
    tabular: undefined,
    type: 'callout',
    variant: 'default',
    weight: 'normal',
  }),
  text: getChatTextStyle({
    align: 'left',
    color: 'gray.text',
    contrast: undefined,
    family: 'brand',
    highContrast: undefined,
    italic: undefined,
    tabular: undefined,
    type: 'callout',
    variant: 'default',
    weight: 'normal',
  }),
  tabular: getChatTextStyle({
    align: 'left',
    color: 'gray',
    contrast: undefined,
    family: 'brand',
    highContrast: undefined,
    italic: undefined,
    tabular: true,
    type: 'callout',
    variant: 'default',
    weight: 'normal',
  }),
} satisfies Record<ChatRowTextTone, TextStyle>;

interface RowTextStyleNode {
  next?: WeakMap<object, RowTextStyleNode>;
  style?: TextStyle;
}

const toneRoots = {
  muted: {},
  text: {},
  tabular: {},
} satisfies Record<ChatRowTextTone, RowTextStyleNode>;

/**
 * Stands in for a falsy part, because a WeakMap key must be an object.
 */
const NO_PART = {};

function getChildNode(
  node: RowTextStyleNode,
  part: ChatRowTextPart,
): RowTextStyleNode {
  const key = part || NO_PART;
  const next = node.next ?? new WeakMap<object, RowTextStyleNode>();
  node.next = next;

  const cached = next.get(key);

  if (cached) {
    return cached;
  }

  const child: RowTextStyleNode = {};
  next.set(key, child);
  return child;
}

function buildRowTextStyle(
  tone: ChatRowTextTone,
  parts: readonly StyleProp<TextStyle>[],
): TextStyle {
  const styleWeight =
    findStyleValue(parts, 'fontFamily') == null
      ? resolveWeightFromFontWeight(findStyleValue(parts, 'fontWeight'))
      : undefined;

  const spanStyles: StyleProp<TextStyle> = [
    toneStyles[tone],
    ...parts,
    styleWeight ? getStyleWeightOverride(styleWeight, undefined) : null,
  ];

  return StyleSheet.flatten(spanStyles) ?? {};
}

/**
 * Resolves what `ChatText` builds per render - the tone's base style, the
 * parts in order and the brand weight override - once per distinct tuple of
 * part identities. The parts are the identity-stable objects from
 * `getChatTextStyles`, `ChatRow.styles` and `getChatColorStyle`, so a row
 * span gets the same style object on every render and `ChatRowText` does no
 * style work.
 *
 * The cache keys on object identity through WeakMaps, so it holds no part
 * that the colour cache has dropped. Do not pass a fresh object literal: it
 * misses every time.
 */
export function getChatRowTextStyle(
  tone: ChatRowTextTone,
  a?: ChatRowTextPart,
  b?: ChatRowTextPart,
  c?: ChatRowTextPart,
  d?: ChatRowTextPart,
  e?: ChatRowTextPart,
): TextStyle {
  const node = getChildNode(
    getChildNode(
      getChildNode(getChildNode(getChildNode(toneRoots[tone], a), b), c),
      d,
    ),
    e,
  );

  if (node.style) {
    return node.style;
  }

  const style = buildRowTextStyle(tone, [a, b, c, d, e]);
  node.style = style;
  return style;
}

const MAX_CACHED_PARTS = 5;

function isStyleArray(
  style: StyleProp<TextStyle>,
): style is readonly StyleProp<TextStyle>[] {
  return Array.isArray(style);
}

/**
 * Collects the members of a nested style array in order.
 */
function collectStyleParts(
  style: StyleProp<TextStyle>,
  parts: ChatRowTextPart[],
): void {
  if (isStyleArray(style)) {
    style.forEach(member => collectStyleParts(member, parts));
    return;
  }

  // SAFETY: StyleSheet.create returns plain objects on this React Native, so no member is a registered style number.
  parts.push((style as ChatRowTextPart) || undefined);
}

/**
 * `getChatRowTextStyle` for a span whose style arrives as a style prop. A
 * nested array of up to five identity-stable members takes the cached path.
 * Anything else resolves without the cache to the same style.
 */
export function getChatRowTextStyleForProp(
  tone: ChatRowTextTone,
  style: StyleProp<TextStyle>,
): TextStyle {
  const parts: ChatRowTextPart[] = [];

  collectStyleParts(style, parts);

  if (parts.length > MAX_CACHED_PARTS) {
    return buildRowTextStyle(tone, parts);
  }

  const [a, b, c, d, e] = parts;
  return getChatRowTextStyle(tone, a, b, c, d, e);
}

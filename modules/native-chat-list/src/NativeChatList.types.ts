import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

/**
 * One resolved text style. Rows refer to a style by its index in the table
 * the list receives in a batch, so a row does not repeat font data per span.
 */
export interface NativeChatTextStyle {
  color: string;
  fontFamily?: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  opacity: number;
  strikethrough: boolean;
  underline: boolean;
}

/**
 * A zero-width emote drawn over its base emote. The frame is in points,
 * relative to the base emote.
 */
export interface NativeChatEmoteOverlay {
  height: number;
  url: string;
  width: number;
  x: number;
  y: number;
}

export type NativeChatSpanKind =
  | 'badge'
  | 'emote'
  | 'link'
  | 'mention'
  | 'text'
  | 'timestamp'
  | 'username';

export interface NativeChatSpan {
  kind: NativeChatSpanKind;

  /**
   * The visible text. For an image span, the name VoiceOver reads.
   */
  text: string;

  /**
   * Index into the text style table.
   */
  style: number;

  /**
   * Replaces the style colour, for sender, mention and accent colours.
   */
  color?: string;

  /**
   * Image URL for an emote or badge span.
   */
  url?: string;

  /**
   * Display size of an image span, in points.
   */
  width?: number;
  height?: number;
  overlays?: NativeChatEmoteOverlay[];

  /**
   * Points to pull this image left over the image before it.
   */
  overlapPrevious?: number;

  /**
   * Opacity of an image span.
   */
  opacity?: number;

  /**
   * Space after the span, in points.
   */
  marginRight?: number;

  /**
   * Rounded fill behind a badge, for 7TV badges that carry a colour.
   */
  tint?: string;

  /**
   * Token index for a token, badge position for a badge, -1 otherwise.
   * Sent back in press events.
   */
  index: number;
}

/**
 * An SF Symbol drawn at the start of a line.
 */
export interface NativeChatLineIcon {
  color: string;
  marginRight: number;
  name: string;
  size: number;
}

/**
 * A rounded tint behind a whole line, such as the "Replying to you" pill.
 */
export interface NativeChatLineBackground {
  color: string;
  paddingHorizontal: number;
  paddingVertical: number;
  radius: number;
}

export interface NativeChatLine {
  background?: NativeChatLineBackground;
  icon?: NativeChatLineIcon;

  /**
   * Height of every line the paragraph wraps to.
   */
  lineHeight: number;
  marginBottom: number;

  /**
   * 0 wraps freely; 1 truncates the line with an ellipsis.
   */
  numberOfLines: number;

  /**
   * A press on this line reports this target instead of the span target.
   */
  pressTarget?: 'reply';

  /**
   * Colour of a strike drawn through the middle of the line, for moderated
   * messages.
   */
  strikeColor?: string;
  spans: NativeChatSpan[];
}

/**
 * The row container: background, left accent bar and padding.
 */
export interface NativeChatRowSurface {
  backgroundColor?: string;
  borderLeftColor?: string;
  borderLeftWidth: number;
  marginVertical: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
}

export interface NativeChatPaintShadow {
  /**
   * Gaussian sigma in points, the value the Skia rasterizer passes to its
   * shadow filter. Core Graphics takes twice this as its blur.
   */
  blur: number;
  color: string;
  x: number;
  y: number;
}

export type NativeChatPaintTile = 'none' | 'repeat' | 'repeat-x' | 'repeat-y';

export interface NativeChatPaintLayer {
  kind: 'image' | 'linear' | 'radial';
  opacity: number;

  /**
   * CSS `background-position` and `background-size` as fractions of the
   * glyph box. Null means the default (top left, full size).
   */
  at: [number, number] | null;
  size: [number, number] | null;

  /**
   * Gradient stops. Repeating gradients arrive already expanded across 0 to 1.
   */
  colors: string[];
  locations: number[];

  /**
   * CSS linear gradient angle in degrees.
   */
  angle: number;
  ellipse: boolean;
  url?: string;
  tile: NativeChatPaintTile;
}

/**
 * A 7TV paint drawn over the row's username span. The span already carries
 * the paint's font and letter case, so layout and paint measure the same
 * glyphs. Layers are ordered bottom first.
 */
export interface NativeChatPaint {
  /**
   * Stable for one paint revision and fallback colour, so native can cache
   * the drawn username.
   */
  key: string;
  baseColor: string;
  dropShadows: NativeChatPaintShadow[];

  /**
   * How far the shadows and stroke reach outside the glyph box, in points.
   */
  insets: { bottom: number; left: number; right: number; top: number };
  layers: NativeChatPaintLayer[];
  stroke?: { color: string; width: number };
  textShadows: NativeChatPaintShadow[];
}

export interface NativeChatRow {
  key: string;
  accessibilityLabel: string;

  /**
   * Plays the React rows' entrance spring the first time the row shows.
   */
  animateEntrance: boolean;
  canJumpToReply: boolean;
  canOpenProfile: boolean;
  lines: NativeChatLine[];
  paint?: NativeChatPaint;
  surface: NativeChatRowSurface;
}

export interface NativeChatListBatch {
  /**
   * When set, replaces every row and the other fields are ignored.
   */
  reset?: NativeChatRow[];
  removeFromStart: number;
  append: NativeChatRow[];
  update: NativeChatRow[];

  /**
   * The whole text style table, sent whenever it grew.
   */
  styles?: NativeChatTextStyle[];
}

export interface NativeChatListConfig {
  animateEmotes: boolean;
}

/**
 * The fields of a React Native scroll event that `use-chat-scroll.ts` reads.
 */
export interface NativeChatScrollPayload {
  contentOffset: { x: number; y: number };
  contentSize: { width: number; height: number };
  layoutMeasurement: { width: number; height: number };
}

export type NativeChatRowTargetKind =
  | 'badge'
  | 'emote'
  | 'link'
  | 'mention'
  | 'reply'
  | 'row'
  | 'username';

export interface NativeChatRowPressPayload {
  key: string;
  target: NativeChatRowTargetKind;

  /**
   * Badge position for a badge, token index for a token, -1 otherwise.
   */
  index: number;
}

type NativeChatEvent<T> = (event: NativeSyntheticEvent<T>) => void;

export interface NativeChatListViewProps {
  composerInset: number;
  config: NativeChatListConfig;
  onEndReached?: NativeChatEvent<Record<string, never>>;
  onMomentumScrollBegin?: NativeChatEvent<NativeChatScrollPayload>;
  onMomentumScrollEnd?: NativeChatEvent<NativeChatScrollPayload>;
  onRowLongPress?: NativeChatEvent<NativeChatRowPressPayload>;
  onRowPress?: NativeChatEvent<NativeChatRowPressPayload>;
  onScroll?: NativeChatEvent<NativeChatScrollPayload>;
  onScrollBeginDrag?: NativeChatEvent<NativeChatScrollPayload>;
  onScrollEndDrag?: NativeChatEvent<NativeChatScrollPayload>;
  onVisibleKeysChange?: NativeChatEvent<{ keys: string[] }>;
  style?: StyleProp<ViewStyle>;
}

/**
 * The view functions the native list exposes on its ref.
 */
export interface NativeChatListViewHandle {
  apply(batch: NativeChatListBatch): Promise<void>;
  scrollToEnd(animated: boolean): Promise<void>;
  scrollToKey(
    key: string,
    animated: boolean,
    viewPosition: number,
  ): Promise<void>;
}

import type { TextStyle } from 'react-native';

import { styles } from '@app/components/chat/components/chat-message/chat-row.styles';
import { getChatTextStyles } from '@app/components/chat/components/chat-message/chat-text.styles';
import {
  CHAT_SURFACE_COLORS,
  densityFromCompact,
  getChatScale,
} from '@app/components/chat/components/chat-message/util/chat-scale';
import { getCachedEmoteAspectRatio } from '@app/providers/cached-emotes-provider/cache-service';
import { calculateAspectRatio } from '@app/utils/chat/calculate-aspect-ratio';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import type { MessageToken } from '@app/utils/chat/message-token';
import { getMessageTokenText } from '@app/utils/chat/message-token-content';
import { formatMentionContent } from '@app/utils/chat/resolve-mention-login/format-mention-content';
import { resolveEmoteDisplayUrl } from '@app/utils/emote/resolve-emote-display-url';
import type {
  NativeChatEmoteOverlay,
  NativeChatLine,
  NativeChatSpan,
} from '@modules/native-chat-list/src/NativeChatList.types';

import type { NativeRowBuildState } from './native-row-context';
import {
  getNativeTextStyle,
  type NativeTextBaseColor,
  type NativeTextStyleEntry,
  resolveNativeTextStyle,
} from './native-text-style-registry';
import { parseStyleString } from './parse-style-value';

export function getRowTextStyles(state: NativeRowBuildState) {
  return getChatTextStyles(state.context.fontScale, state.context.compact);
}

export function getRowScale(state: NativeRowBuildState) {
  return getChatScale(
    state.context.fontScale,
    densityFromCompact(state.context.compact),
  );
}

export function textSpan(
  text: string,
  style: number,
  color?: string,
): NativeChatSpan {
  return color
    ? { kind: 'text', text, style, color, index: -1 }
    : { kind: 'text', text, style, index: -1 };
}

/**
 * Short form for the style table lookup the builders call on every span.
 */
export function style(
  entries: readonly NativeTextStyleEntry[],
  base?: NativeTextBaseColor,
): number {
  return resolveNativeTextStyle(entries, base);
}

interface LineOptions {
  background?: NativeChatLine['background'];
  icon?: NativeChatLine['icon'];
  marginBottom?: number;

  /**
   * Line height when the line holds emotes, which the spans do not carry.
   */
  minLineHeight?: number;
  numberOfLines?: number;
  pressTarget?: NativeChatLine['pressTarget'];
  strikeColor?: string;
}

/**
 * One wrapped paragraph. Like a React Native line box, it is as tall as its
 * tallest span or image.
 */
export function line(
  spans: NativeChatSpan[],
  options: LineOptions = {},
): NativeChatLine {
  let lineHeight = options.minLineHeight ?? 0;

  for (const span of spans) {
    lineHeight = Math.max(
      lineHeight,
      getNativeTextStyle(span.style).lineHeight,
      span.height ?? 0,
    );
  }

  return {
    background: options.background,
    icon: options.icon,
    lineHeight,
    marginBottom: options.marginBottom ?? 0,
    numberOfLines: options.numberOfLines ?? 0,
    pressTarget: options.pressTarget,
    spans,
    strikeColor: options.strikeColor,
  };
}

interface MetaLineOptions {
  icon: string;
  iconColor?: string;
  iconSize?: number;
  marginBottom?: number;
  spans: NativeChatSpan[];
}

/**
 * `ChatNoticeMetaRow`: a tinted SF Symbol, then the label spans.
 */
export function metaLine({
  icon,
  iconColor,
  iconSize = 12,
  marginBottom = 4,
  spans,
}: MetaLineOptions): NativeChatLine {
  return line(spans, {
    icon: {
      color: iconColor ?? CHAT_SURFACE_COLORS.muted,
      marginRight: 4,
      name: icon,
      size: iconSize,
    },
    marginBottom,
  });
}

type ChatTextStyles = ReturnType<typeof getChatTextStyles>;

/**
 * The label a `ChatNoticeMetaRow` draws when it has no children. Its
 * `labelStyle` comes after `labelColor`, so a colour in the style wins.
 */
export function metaLabelSpan(
  textStyles: ChatTextStyles,
  label: string,
  labelColor: string | undefined,
  labelStyle?: TextStyle,
): NativeChatSpan {
  const styleColor = labelStyle?.color;

  return textSpan(
    label,
    style([textStyles.meta, textStyles.metaStrong, labelStyle]),
    parseStyleString(styleColor) ? undefined : labelColor,
  );
}

interface EmoteSpanOptions {
  disableAnimations: boolean;
  index: number;
  overlapPrevious: boolean;
  targetSize: number;
}

function overlayFrames(
  token: MessageToken<'emote'>,
  base: { width: number; height: number },
  { disableAnimations, targetSize }: EmoteSpanOptions,
): NativeChatEmoteOverlay[] | undefined {
  const overlays = token.overlaid?.flatMap(overlay => {
    const url = resolveEmoteDisplayUrl(overlay, { disableAnimations });

    if (!url) {
      return [];
    }

    const { height, width } = calculateAspectRatio(
      overlay.width || 20,
      overlay.height || 20,
      targetSize,
    );

    return [
      {
        height,
        url,
        width,
        x: Math.round((base.width - width) / 2),
        y: Math.round((base.height - height) / 2),
      },
    ];
  });

  return overlays && overlays.length > 0 ? overlays : undefined;
}

/**
 * `EmoteToken`. Twitch, BTTV and some 7TV emotes carry no size, so their box
 * uses the decoded aspect ratio when the emote cache already has it.
 */
export function emoteSpan(
  state: NativeRowBuildState,
  token: MessageToken<'emote'>,
  options: EmoteSpanOptions,
): NativeChatSpan {
  const url = resolveEmoteDisplayUrl(token, {
    disableAnimations: options.disableAnimations,
  });

  const size =
    token.width && token.height
      ? calculateAspectRatio(token.width, token.height, options.targetSize)
      : calculateAspectRatio(
          (url ? getCachedEmoteAspectRatio(url) : null) ?? 1,
          1,
          options.targetSize,
        );

  const label = token.content || token.name || '';

  if (!url) {
    return {
      ...textSpan(label, style([getRowTextStyles(state).body])),
      index: options.index,
    };
  }

  return {
    kind: 'emote',
    text: label,
    style: style([]),
    url,
    width: size.width,
    height: size.height,
    overlays: overlayFrames(token, size, options),
    overlapPrevious: options.overlapPrevious
      ? Math.round(size.width * 0.72)
      : undefined,
    index: options.index,
  };
}

export interface TokenSpanOptions {
  emoteSize: number;

  /**
   * The taller emote line height, added to link and mention spans.
   */
  emoteLineStyle?: TextStyle;

  /**
   * Position of `tokens[0]` in the whole message, so press events report the
   * message's token index.
   */
  indexOffset?: number;
  mode: 'message' | 'system';
  noticeMsgId?: string;
  replyPlainMentionTarget?: string;
  textColor?: string;

  /**
   * Style index for plain text runs.
   */
  textStyle: number;
}

function mentionSpan(
  state: NativeRowBuildState,
  content: string,
  index: number,
  options: TokenSpanOptions,
): NativeChatSpan | null {
  const mentionContent = formatMentionContent(content);

  if (!mentionContent.trim()) {
    return null;
  }

  const mentionedUsername = mentionContent.replace(/^@/, '').trim();
  const normalised = normaliseChatUsername(mentionedUsername);

  if (
    options.replyPlainMentionTarget &&
    normalised === options.replyPlainMentionTarget
  ) {
    return { ...textSpan(mentionContent, options.textStyle), index };
  }

  const { context } = state;
  const textStyles = getRowTextStyles(state);

  const isHighlighted =
    context.highlightedUserSet.has(normalised) ||
    context.currentUsernameNormalized === normalised;

  const color = context.getMentionColor(mentionedUsername);
  state.mentions.push({ color, username: mentionedUsername });

  return {
    kind: 'mention',
    text: mentionContent,
    style: style([
      textStyles.mention,
      options.emoteLineStyle,
      isHighlighted && styles.mentionHighlighted,
    ]),
    color,
    index,
  };
}

function cheermoteSpans(
  state: NativeRowBuildState,
  token: MessageToken<'cheermote'>,
  index: number,
  options: TokenSpanOptions,
): NativeChatSpan[] {
  const { context } = state;
  const textStyles = getRowTextStyles(state);

  const url = context.disableEmoteAnimations
    ? token.cheermote.static_url || token.cheermote.url
    : token.cheermote.url || token.cheermote.static_url;

  if (!url) {
    return [{ ...textSpan(token.content, style([textStyles.body])), index }];
  }

  return [
    {
      kind: 'emote',
      text: token.content,
      style: style([]),
      url,
      width: options.emoteSize,
      height: options.emoteSize,
      marginRight: 2,
      index,
    },
    {
      ...textSpan(
        String(token.cheermote.bits),
        style([textStyles.body, styles.mentionHighlighted]),
        token.cheermote.color,
      ),
      index,
    },
  ];
}

function systemTextSpan(
  state: NativeRowBuildState,
  content: string,
  options: TokenSpanOptions,
): NativeChatSpan | null {
  if (!content.trim()) {
    return null;
  }

  const textStyles = getRowTextStyles(state);

  const isRaidNotice =
    options.noticeMsgId === 'raid' || options.noticeMsgId === 'unraid';

  return textSpan(
    content,
    style(
      isRaidNotice
        ? [textStyles.meta, styles.raidNoticeText]
        : [textStyles.body, styles.systemMessageText],
    ),
  );
}

function tokenSpans(
  state: NativeRowBuildState,
  tokens: MessageToken[],
  index: number,
  options: TokenSpanOptions,
): NativeChatSpan[] {
  const token = tokens[index];

  if (!token) {
    return [];
  }

  const textStyles = getRowTextStyles(state);

  switch (token.type) {
    case 'emote': {
      const previous = tokens[index - 1];

      return [
        emoteSpan(state, token, {
          disableAnimations: state.context.disableEmoteAnimations,
          index,
          overlapPrevious:
            Boolean(token.zero_width) && previous?.type === 'emote',
          targetSize: options.emoteSize,
        }),
      ];
    }

    case 'mention': {
      const span = mentionSpan(
        state,
        getMessageTokenText(token),
        index,
        options,
      );

      return span ? [span] : [];
    }

    case 'cheermote':
      return cheermoteSpans(state, token, index, options);

    case 'link':
    case 'stvEmoteLink':
    case 'twitchClip': {
      const content = getMessageTokenText(token);

      if (!content.trim()) {
        return [];
      }

      return [
        {
          kind: 'link',
          text: content,
          style: style([textStyles.link, options.emoteLineStyle]),
          index,
        },
      ];
    }

    default:
      return [];
  }
}

/**
 * `InlineTokens` and `WrappedTokens` in one pass. Neighbouring text tokens
 * join into one run; a whitespace-only run keeps its space between images.
 */
export function messageTokenSpans(
  state: NativeRowBuildState,
  tokens: MessageToken[],
  options: TokenSpanOptions,
): NativeChatSpan[] {
  const spans: NativeChatSpan[] = [];
  let pendingText: string | null = null;
  let pendingIndex = -1;

  const flushPendingText = () => {
    if (pendingText === null) {
      return;
    }

    const span =
      options.mode === 'system'
        ? systemTextSpan(state, pendingText, options)
        : textSpan(pendingText, options.textStyle, options.textColor);

    if (span) {
      spans.push({ ...span, index: pendingIndex });
    }

    pendingText = null;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token?.type === 'text') {
      pendingIndex = pendingText === null ? index : pendingIndex;
      pendingText = (pendingText ?? '') + getMessageTokenText(token);
      continue;
    }

    flushPendingText();
    spans.push(...tokenSpans(state, tokens, index, options));
  }

  flushPendingText();

  const offset = options.indexOffset ?? 0;

  return offset === 0
    ? spans
    : spans.map(span =>
        span.index >= 0 ? { ...span, index: span.index + offset } : span,
      );
}

const UNSPOKEN_SPAN_KINDS: ReadonlySet<NativeChatSpan['kind']> = new Set([
  'badge',
  'timestamp',
]);

/**
 * A right margin draws a gap the text does not hold, so VoiceOver needs a
 * space there to read two words.
 */
function spokenSpanText(span: NativeChatSpan): string {
  return span.marginRight ? `${span.text} ` : span.text;
}

/**
 * What VoiceOver reads for a row: every line's text and emote names, without
 * badges or the timestamp.
 */
export function getAccessibilityLabel(lines: NativeChatLine[]): string {
  const spokenLines: string[] = [];

  for (const rowLine of lines) {
    let text = '';

    for (const span of rowLine.spans) {
      text += UNSPOKEN_SPAN_KINDS.has(span.kind) ? '' : spokenSpanText(span);
    }

    const spoken = text.replace(/\s+/g, ' ').trim();

    if (spoken) {
      spokenLines.push(spoken);
    }
  }

  return spokenLines.join('. ');
}

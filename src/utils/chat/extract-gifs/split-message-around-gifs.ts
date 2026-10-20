import type { TwitchGifSpan } from './parse-twitch-gifs-tag';

export type MessageGifSegment =
  | { kind: 'text'; text: string }
  | {
      content: string;
      gifId: string;
      kind: 'gif';
      url: string;
    };

const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;

/**
 * Cuts the message body into alternating text and GIF segments using
 * code-point indices from the `gifs` tag.
 */
export function splitMessageAroundGifs(
  message: string,
  spans: TwitchGifSpan[],
): MessageGifSegment[] {
  if (spans.length === 0) {
    return [{ kind: 'text', text: message }];
  }

  const graphemes = SURROGATE_PAIR_REGEX.test(message) ? [...message] : null;
  const length = graphemes?.length ?? message.length;
  const segments: MessageGifSegment[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start < cursor || span.start >= length) {
      continue;
    }

    if (span.start > cursor) {
      const text = graphemes
        ? graphemes.slice(cursor, span.start).join('')
        : message.slice(cursor, span.start);

      if (text) {
        segments.push({ kind: 'text', text });
      }
    }

    const end = Math.min(span.end, length - 1);

    segments.push({
      kind: 'gif',
      gifId: span.gifId,
      url: span.url,
      content: span.content,
    });

    cursor = end + 1;
  }

  if (cursor < length) {
    const text = graphemes
      ? graphemes.slice(cursor).join('')
      : message.slice(cursor);

    if (text) {
      segments.push({ kind: 'text', text });
    }
  }
  return segments;
}

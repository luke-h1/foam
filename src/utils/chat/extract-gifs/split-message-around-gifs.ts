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

function sliceBody(
  message: string,
  graphemes: string[] | null,
  start: number,
  end: number,
): string {
  if (graphemes) {
    return graphemes.slice(start, end).join('');
  }

  return message.slice(start, end);
}

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

    const leadingText =
      span.start > cursor
        ? sliceBody(message, graphemes, cursor, span.start)
        : '';

    if (leadingText) {
      segments.push({ kind: 'text', text: leadingText });
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

  const trailingText =
    cursor < length ? sliceBody(message, graphemes, cursor, length) : '';

  if (trailingText) {
    segments.push({ kind: 'text', text: trailingText });
  }

  return segments;
}

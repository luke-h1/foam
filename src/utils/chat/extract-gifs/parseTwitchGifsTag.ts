/**
 * One GIF span from the IRC `gifs` tag. Indices are inclusive code-point
 * offsets into the message body, matching the Twitch `emotes` tag.
 */
export interface TwitchGifSpan {
  content: string;
  end: number;
  gifId: string;
  start: number;
  url: string;
}

const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;

/**
 * One `gifs` entry: `start-end|gif_id|url`. The URL keeps any later `|`
 * characters; only the first two bars are delimiters.
 */
const TWITCH_GIF_ENTRY_REGEX = /^(\d+)-(\d+)\|([^|]*)\|(.+)$/;

/**
 * Splits a `gifs` tag into entries without breaking on commas that sit inside
 * a URL. The next entry always starts as `,digits-digits|`.
 */
function splitGifEntries(gifsTag: string): string[] {
  const entries: string[] = [];
  let remaining = gifsTag.trim();

  while (remaining) {
    const nextEntry = remaining.search(/,\d+-\d+\|/);

    if (nextEntry === -1) {
      entries.push(remaining);
      break;
    }

    entries.push(remaining.slice(0, nextEntry));
    remaining = remaining.slice(nextEntry + 1);
  }

  return entries;
}

/**
 * Parses Twitch IRC `gifs` tag values of the form
 * `start-end|gif_id|url[,start-end|gif_id|url...]`.
 */
export function parseTwitchGifsTag(
  gifsTag: string | undefined,
  message: string,
): TwitchGifSpan[] {
  if (!gifsTag?.trim()) {
    return [];
  }

  const graphemes = SURROGATE_PAIR_REGEX.test(message) ? [...message] : null;
  const spans: TwitchGifSpan[] = [];

  for (const entry of splitGifEntries(gifsTag)) {
    const match = TWITCH_GIF_ENTRY_REGEX.exec(entry);

    if (!match) {
      continue;
    }

    const start = Number(match[1]);
    const end = Number(match[2]);
    const gifId = match[3]?.trim() ?? '';
    const url = match[4]?.trim() ?? '';

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < 0 ||
      end < start ||
      !gifId ||
      !url
    ) {
      continue;
    }

    const content = graphemes
      ? graphemes.slice(start, end + 1).join('')
      : message.slice(start, end + 1);

    spans.push({ start, end, gifId, url, content });
  }

  return spans.sort((left, right) => left.start - right.start);
}

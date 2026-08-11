import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getTwitchClipIdFromUrl } from '@app/utils/chat/parseWordLinkParts/getTwitchClipIdFromUrl';
import { SEVENTV_EMOTE_LINK_REGEX } from '@app/utils/chat/parseWordLinkParts/SEVENTV_EMOTE_LINK_REGEX';

const GENERIC_HTTP_URL_REGEX = /^https?:\/\//i;
const TRAILING_URL_PUNCTUATION = new Set('.,!?;:\'"\\)]}>'.split(''));

function splitTrailingUrlPunctuation(word: string): {
  urlCandidate: string;
  trailing: string;
} {
  let end = word.length;

  while (end > 0 && TRAILING_URL_PUNCTUATION.has(word[end - 1] ?? '')) {
    end -= 1;
  }

  return {
    urlCandidate: word.slice(0, end),
    trailing: word.slice(end),
  };
}

export function parseWordLinkParts(word: string): ParsedPart[] | null {
  // Runs for every word of every parsed message; ~99.9% of words aren't
  // links, so reject before allocating the punctuation split. Words arrive
  // pre-split on whitespace, and stripping trailing punctuation can't make a
  // non-http prefix into one.
  if (!word || !GENERIC_HTTP_URL_REGEX.test(word)) {
    return null;
  }

  const { urlCandidate, trailing } = splitTrailingUrlPunctuation(word);

  if (!GENERIC_HTTP_URL_REGEX.test(urlCandidate)) {
    return null;
  }

  const trailingTextPart: ParsedPart[] = trailing
    ? [{ type: 'text', content: trailing }]
    : [];

  const sevenTvMatch = urlCandidate.match(SEVENTV_EMOTE_LINK_REGEX);
  if (sevenTvMatch) {
    return [
      {
        type: 'stvEmote',
        content: urlCandidate,
        url: urlCandidate,
      },
      ...trailingTextPart,
    ];
  }

  const clipId = getTwitchClipIdFromUrl(urlCandidate);
  if (clipId) {
    return [
      {
        type: 'twitchClip',
        content: urlCandidate,
        url: urlCandidate,
      },
      ...trailingTextPart,
    ];
  }

  return [
    {
      type: 'link',
      content: urlCandidate,
      url: urlCandidate,
    },
    ...trailingTextPart,
  ];
}

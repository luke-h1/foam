import type { MessageToken } from '@app/utils/chat/message-token';
import { getTwitchClipIdFromUrl } from '@app/utils/chat/parse-word-link-tokens/get-twitch-clip-id-from-url';
import { SEVEN_TV_EMOTE_LINK_REGEX } from '@app/utils/chat/parse-word-link-tokens/seven-tv-emote-link-regex';

const GENERIC_HTTP_URL_REGEX = /^https?:\/\//i;
const TRAILING_URL_PUNCTUATION = new Set('.,!?;:\'"\\)]}>'.split(''));

type SplitUrlWord = {
  urlCandidate: string;
  trailing: string;
};

function splitTrailingUrlPunctuation(word: string): SplitUrlWord {
  let end = word.length;

  while (end > 0 && TRAILING_URL_PUNCTUATION.has(word[end - 1] ?? '')) {
    end -= 1;
  }

  return {
    urlCandidate: word.slice(0, end),
    trailing: word.slice(end),
  };
}

export function parseWordLinkParts(word: string): MessageToken[] | null {
  // Runs for every word of every parsed message; ~99.9% of words aren't
  // links, so reject before allocating the punctuation split.
  if (!word || !GENERIC_HTTP_URL_REGEX.test(word)) {
    return null;
  }

  const { urlCandidate, trailing } = splitTrailingUrlPunctuation(word);

  if (!GENERIC_HTTP_URL_REGEX.test(urlCandidate)) {
    return null;
  }

  const trailingTextToken: MessageToken[] = trailing
    ? [{ type: 'text', content: trailing }]
    : [];

  const sevenTvMatch = urlCandidate.match(SEVEN_TV_EMOTE_LINK_REGEX);

  if (sevenTvMatch) {
    return [
      {
        type: 'stvEmoteLink',
        content: urlCandidate,
        url: urlCandidate,
      },
      ...trailingTextToken,
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
      ...trailingTextToken,
    ];
  }

  return [
    {
      type: 'link',
      content: urlCandidate,
      url: urlCandidate,
    },
    ...trailingTextToken,
  ];
}

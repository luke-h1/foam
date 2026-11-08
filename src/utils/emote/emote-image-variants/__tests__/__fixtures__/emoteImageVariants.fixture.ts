import type { BttvSanitisedEmote, FfzSanitisedEmote } from '@app/types/emote';

function createBaseFields(url: string) {
  return {
    creator: null,
    emote_link: 'https://example.com/emote',
    id: 'emote-id',
    name: 'Dance',
    original_name: 'Dance',
    url,
  };
}

export function createBttvEmote(url: string): BttvSanitisedEmote {
  return {
    ...createBaseFields(url),
    site: 'BTTV',
    provider: 'bttv',
  };
}

export function createFfzEmote(url: string): FfzSanitisedEmote {
  return {
    ...createBaseFields(url),
    site: 'FFZ',
    provider: 'ffz',
  };
}

import { EmoteSetKind } from '@app/graphql/generated/gql';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SevenTvSanitisedEmote,
} from '@app/types/emote';

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
  };
}

export function createFfzEmote(url: string): FfzSanitisedEmote {
  return {
    ...createBaseFields(url),
    site: 'FFZ',
  };
}

export function createSevenTvEmote(url: string): SevenTvSanitisedEmote {
  return {
    ...createBaseFields(url),
    aspect_ratio: 1,
    flags: 0,
    format: 'WEBP',
    frame_count: 2,
    height: 32,
    set_metadata: {
      capacity: null,
      kind: EmoteSetKind.Normal,
      ownerId: null,
      setId: 'set-id',
      setName: 'global',
      totalCount: 1,
      updatedAt: '2026-05-19T00:00:00Z',
    },
    site: '7TV Global',
    width: 32,
    zero_width: false,
  };
}

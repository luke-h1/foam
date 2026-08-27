import { EmoteSetKind } from '@app/graphql/generated/gql';
import type {
  BttvSanitisedEmote,
  FfzSanitisedEmote,
  SanitisedEmote,
  SevenTvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';

/**
 * Dropping the two discriminants keeps this assignable to each provider's own
 * partial, so the branches below stay checked instead of asserted.
 */
type MenuEmoteOverrides = Partial<
  Omit<SevenTvSanitisedEmote, 'provider' | 'site'> &
    Omit<TwitchSanitisedEmote, 'provider' | 'site'> &
    Omit<BttvSanitisedEmote, 'provider' | 'site'> &
    Omit<FfzSanitisedEmote, 'provider' | 'site'>
>;

const defaultSevenTvMetadata = {
  setId: 'set-default',
  setName: 'Default Set',
  capacity: null,
  ownerId: null,
  kind: EmoteSetKind.Normal,
  updatedAt: '',
  totalCount: 2,
} satisfies SevenTvSanitisedEmote['set_metadata'];

export function createSevenTvMenuEmote(
  id: string,
  name: string,
  site: SevenTvSanitisedEmote['site'],
  overrides: Partial<SevenTvSanitisedEmote> = {},
): SevenTvSanitisedEmote {
  return {
    id,
    name,
    original_name: name,
    url: `https://cdn.example.com/${id}.webp`,
    creator: null,
    emote_link: '',
    site,
    frame_count: 1,
    format: 'webp',
    flags: 0,
    aspect_ratio: 1,
    zero_width: false,
    width: 32,
    height: 32,
    set_metadata: defaultSevenTvMetadata,
    ...overrides,
    provider: '7tv',
  };
}

export function createTwitchMenuEmote(
  id: string,
  name: string,
  site: TwitchSanitisedEmote['site'],
  overrides: Partial<TwitchSanitisedEmote> = {},
): TwitchSanitisedEmote {
  return {
    id,
    name,
    original_name: name,
    url: `https://cdn.example.com/${id}.webp`,
    creator: null,
    emote_link: '',
    site,
    ...overrides,
    provider: 'twitch',
  };
}

export function createMenuEmote(
  id: string,
  name: string,
  site: SanitisedEmote['site'],
  overrides: MenuEmoteOverrides = {},
): SanitisedEmote {
  if (
    site === '7TV Channel' ||
    site === '7TV Global' ||
    site === '7TV Personal'
  ) {
    return createSevenTvMenuEmote(id, name, site, overrides);
  }

  if (
    site === 'Twitch Channel' ||
    site === 'Twitch Global' ||
    site === 'Twitch Subscriber'
  ) {
    return createTwitchMenuEmote(id, name, site, overrides);
  }

  if (site === 'BTTV' || site === 'Global BTTV') {
    return {
      id,
      name,
      original_name: name,
      url: `https://cdn.example.com/${id}.webp`,
      creator: null,
      emote_link: '',
      site,
      ...overrides,
      provider: 'bttv',
    } satisfies BttvSanitisedEmote;
  }

  if (site === 'FFZ' || site === 'Global FFZ') {
    return {
      id,
      name,
      original_name: name,
      url: `https://cdn.example.com/${id}.webp`,
      creator: null,
      emote_link: '',
      site,
      ...overrides,
      provider: 'ffz',
    } satisfies FfzSanitisedEmote;
  }

  throw new Error(`Unsupported menu emote site: ${site}`);
}

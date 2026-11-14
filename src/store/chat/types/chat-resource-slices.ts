import type { Preferences } from '@app/store/preference-store';
import type { ProviderId, SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export type SliceScope = 'channel' | 'global';
export type SliceKind = 'emote' | 'badge';

interface ChatResourceSliceDefinition {
  key: string;
  scope: SliceScope;
  provider: Extract<ProviderId, 'bttv' | 'ffz' | '7tv' | 'twitch'>;
  kind: SliceKind;
  preference: keyof Preferences;
}

const CHAT_RESOURCE_SLICES = [
  {
    key: 'twitchChannelEmotes',
    scope: 'channel',
    provider: 'twitch',
    kind: 'emote',
    preference: 'showTwitchEmotes',
  },
  {
    key: 'twitchSubscriberEmotes',
    scope: 'channel',
    provider: 'twitch',
    kind: 'emote',
    preference: 'showTwitchEmotes',
  },
  {
    key: 'sevenTvChannelEmotes',
    scope: 'channel',
    provider: '7tv',
    kind: 'emote',
    preference: 'show7TvEmotes',
  },
  {
    key: 'ffzChannelEmotes',
    scope: 'channel',
    provider: 'ffz',
    kind: 'emote',
    preference: 'showFFzEmotes',
  },
  {
    key: 'bttvChannelEmotes',
    scope: 'channel',
    provider: 'bttv',
    kind: 'emote',
    preference: 'showBttvEmotes',
  },
  {
    key: 'twitchChannelBadges',
    scope: 'channel',
    provider: 'twitch',
    kind: 'badge',
    preference: 'showTwitchBadges',
  },
  {
    key: 'ffzChannelBadges',
    scope: 'channel',
    provider: 'ffz',
    kind: 'badge',
    preference: 'showFFzBadges',
  },
  {
    key: 'twitchGlobalEmotes',
    scope: 'global',
    provider: 'twitch',
    kind: 'emote',
    preference: 'showTwitchEmotes',
  },
  {
    key: 'sevenTvGlobalEmotes',
    scope: 'global',
    provider: '7tv',
    kind: 'emote',
    preference: 'show7TvEmotes',
  },
  {
    key: 'ffzGlobalEmotes',
    scope: 'global',
    provider: 'ffz',
    kind: 'emote',
    preference: 'showFFzEmotes',
  },
  {
    key: 'bttvGlobalEmotes',
    scope: 'global',
    provider: 'bttv',
    kind: 'emote',
    preference: 'showBttvEmotes',
  },
  {
    key: 'twitchGlobalBadges',
    scope: 'global',
    provider: 'twitch',
    kind: 'badge',
    preference: 'showTwitchBadges',
  },
  {
    key: 'ffzGlobalBadges',
    scope: 'global',
    provider: 'ffz',
    kind: 'badge',
    preference: 'showFFzBadges',
  },
] as const satisfies readonly ChatResourceSliceDefinition[];

type ChatResourceSlice = (typeof CHAT_RESOURCE_SLICES)[number];

export type ChatResourceSliceKey<
  TScope extends SliceScope = SliceScope,
  TKind extends SliceKind = SliceKind,
> = Extract<ChatResourceSlice, { scope: TScope; kind: TKind }>['key'];

type SlicePreference = ChatResourceSlice['preference'];

type SliceItems<TKey extends ChatResourceSliceKey> =
  TKey extends ChatResourceSliceKey<SliceScope, 'emote'>
    ? SanitisedEmote[]
    : SanitisedBadgeSet[];

export type ChatResourceSliceRecord<TKey extends ChatResourceSliceKey> = {
  [Key in TKey]: SliceItems<Key>;
};

function sliceKeys<TScope extends SliceScope, TKind extends SliceKind>(
  scopes: readonly TScope[],
  kinds: readonly TKind[],
): ChatResourceSliceKey<TScope, TKind>[] {
  const keys: string[] = [];

  for (const slice of CHAT_RESOURCE_SLICES) {
    const matches =
      scopes.some(scope => scope === slice.scope) &&
      kinds.some(kind => kind === slice.kind);

    if (matches) {
      keys.push(slice.key);
    }
  }

  // SAFETY: every pushed key belongs to a row whose scope and kind passed the filter above.
  return keys as ChatResourceSliceKey<TScope, TKind>[];
}

const ALL_SCOPES: readonly SliceScope[] = ['channel', 'global'];
const ALL_KINDS: readonly SliceKind[] = ['emote', 'badge'];

export const ALL_SLICE_KEYS = sliceKeys(ALL_SCOPES, ALL_KINDS);
export const CHANNEL_SLICE_KEYS = sliceKeys(['channel'], ALL_KINDS);
export const GLOBAL_SLICE_KEYS = sliceKeys(['global'], ALL_KINDS);
export const EMOTE_SLICE_KEYS = sliceKeys(ALL_SCOPES, ['emote']);
export const BADGE_SLICE_KEYS = sliceKeys(ALL_SCOPES, ['badge']);
export const CHANNEL_EMOTE_SLICE_KEYS = sliceKeys(['channel'], ['emote']);
export const CHANNEL_BADGE_SLICE_KEYS = sliceKeys(['channel'], ['badge']);
export const GLOBAL_EMOTE_SLICE_KEYS = sliceKeys(['global'], ['emote']);
export const GLOBAL_BADGE_SLICE_KEYS = sliceKeys(['global'], ['badge']);

export const SLICE_BY_KEY =
  // SAFETY: the table has one row per key, so the entries cover every key once.
  Object.fromEntries(CHAT_RESOURCE_SLICES.map(slice => [slice.key, slice])) as {
    [Key in ChatResourceSliceKey]: Extract<ChatResourceSlice, { key: Key }>;
  };

export function mapSlices<TKey extends ChatResourceSliceKey>(
  keys: readonly TKey[],
  getSlice: (key: TKey) => SliceItems<TKey>,
): ChatResourceSliceRecord<TKey> {
  // SAFETY: the loop below sets every key in `keys`, which is the full key set of the record.
  const record = {} as ChatResourceSliceRecord<TKey>;

  for (const key of keys) {
    record[key] = getSlice(key);
  }

  // oxlint-disable-next-line anti-slop/no-known-value-widening -- the record is filled key by key, so the mapped type is the only contract it has
  return record;
}

export const GATE_EXTRA_PREFERENCE_KEYS = ['showBttvBadges'] as const;

type GatePreferences = Pick<
  Preferences,
  SlicePreference | (typeof GATE_EXTRA_PREFERENCE_KEYS)[number]
>;

export type GatedEmoteData = ChatResourceSliceRecord<ChatResourceSliceKey> & {
  chatterinoBadges: SanitisedBadgeSet[];
  bttvBadges: SanitisedBadgeSet[];
};

interface GateEmoteDataOptions {
  slices: ChatResourceSliceRecord<ChatResourceSliceKey>;
  preferences: GatePreferences;
  chatterinoBadges: SanitisedBadgeSet[];
  bttvBadges: SanitisedBadgeSet[];
}

const NO_ITEMS: never[] = [];

export function gateEmoteData({
  slices,
  preferences,
  chatterinoBadges,
  bttvBadges,
}: GateEmoteDataOptions): GatedEmoteData {
  return {
    ...mapSlices(ALL_SLICE_KEYS, key =>
      preferences[SLICE_BY_KEY[key].preference] ? slices[key] : NO_ITEMS,
    ),
    chatterinoBadges,
    bttvBadges: preferences.showBttvBadges ? bttvBadges : NO_ITEMS,
  };
}

interface SessionEmoteExtras<TPersonal, TProfiles> {
  sevenTvPersonalEmotes: TPersonal;
  twitchSubscriberChannelProfiles: TProfiles;
}

export function gateSessionEmoteExtras<TPersonal, TProfiles>(
  extras: SessionEmoteExtras<TPersonal, TProfiles>,
  empty: SessionEmoteExtras<TPersonal, TProfiles>,
  preferences: GatePreferences,
): SessionEmoteExtras<TPersonal, TProfiles> {
  return {
    sevenTvPersonalEmotes: preferences[
      SLICE_BY_KEY.sevenTvChannelEmotes.preference
    ]
      ? extras.sevenTvPersonalEmotes
      : empty.sevenTvPersonalEmotes,
    twitchSubscriberChannelProfiles: preferences[
      SLICE_BY_KEY.twitchSubscriberEmotes.preference
    ]
      ? extras.twitchSubscriberChannelProfiles
      : empty.twitchSubscriberChannelProfiles,
  };
}

export const EMPTY_GATED_EMOTE_DATA: GatedEmoteData = {
  ...mapSlices(ALL_SLICE_KEYS, () => NO_ITEMS),
  chatterinoBadges: NO_ITEMS,
  bttvBadges: NO_ITEMS,
};

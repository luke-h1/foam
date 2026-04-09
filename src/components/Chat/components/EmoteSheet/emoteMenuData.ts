import { BrandIconName } from '@app/components/BrandIcon/BrandIcon';
import { emptyEmoteData } from '@app/store/chatStore/constants';
import type { SanitisedEmote } from '@app/types/emote';

import type { EmotePickerItem } from './EmoteSheet';

export type EmoteMenuProviderId = '7TV' | 'Twitch' | 'FFZ' | 'BTTV' | 'Emoji';
export type EmoteMenuIcon = BrandIconName | 'ffz' | `emoji:${string}`;

export interface EmoteMenuSet {
  emotes: EmotePickerItem[];
  icon: EmoteMenuIcon;
  id: string;
  provider: EmoteMenuProviderId;
  shortLabel: string;
  title: string;
}

export interface EmoteMenuProvider {
  emoteCount: number;
  icon: EmoteMenuIcon;
  id: EmoteMenuProviderId;
  sets: EmoteMenuSet[];
  title: string;
}

export interface EmoteMenuDataInput {
  bttvChannelEmotes?: SanitisedEmote[];
  bttvGlobalEmotes?: SanitisedEmote[];
  emojis?: string[];
  emojiSets?: Array<{
    data: string[];
    icon: `emoji:${string}`;
    id: string;
    title: string;
  }>;
  ffzChannelEmotes?: SanitisedEmote[];
  ffzGlobalEmotes?: SanitisedEmote[];
  sevenTvChannelEmotes?: SanitisedEmote[];
  sevenTvGlobalEmotes?: SanitisedEmote[];
  twitchChannelEmotes?: SanitisedEmote[];
  twitchGlobalEmotes?: SanitisedEmote[];
}

function chunk<TItem>(items: TItem[], size: number): TItem[][] {
  const rows: TItem[][] = [];

  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }

  return rows;
}

function makeShortLabel(title: string): string {
  const words = title
    .split(/[\s·-]+/)
    .map(word => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return (words[0] ?? '?').slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase();
}

function makeSet(
  id: string,
  provider: EmoteMenuProviderId,
  title: string,
  icon: EmoteMenuIcon,
  emotes: EmotePickerItem[],
): EmoteMenuSet {
  return {
    id,
    provider,
    title,
    icon,
    emotes,
    shortLabel: icon.startsWith('emoji:')
      ? icon.slice(6)
      : makeShortLabel(title),
  };
}

function groupSevenTvSets(
  providerLabel: 'Channel' | 'Global',
  emotes: SanitisedEmote[],
): EmoteMenuSet[] {
  const grouped = new Map<
    string,
    {
      emotes: SanitisedEmote[];
      title: string;
    }
  >();

  emotes.forEach(emote => {
    const setId =
      'set_metadata' in emote && emote.set_metadata?.setId
        ? emote.set_metadata.setId
        : `${providerLabel.toLowerCase()}-${emote.site}`;
    const setName =
      'set_metadata' in emote && emote.set_metadata?.setName
        ? emote.set_metadata.setName
        : `${providerLabel} Emotes`;

    const existing = grouped.get(setId);
    if (existing) {
      existing.emotes.push(emote);
      return;
    }

    grouped.set(setId, {
      title: setName,
      emotes: [emote],
    });
  });

  return Array.from(grouped.entries())
    .map(([setId, value]) =>
      makeSet(
        `7tv-${providerLabel.toLowerCase()}-${setId}`,
        '7TV',
        value.title,
        'stv',
        value.emotes,
      ),
    )
    .sort((left, right) => left.title.localeCompare(right.title));
}

function createEmojiSets(emojis: string[]): EmoteMenuSet[] {
  const categories: Array<{
    icon: `emoji:${string}`;
    id: string;
    title: string;
  }> = [
    { id: 'emoji-smileys', title: 'Smileys', icon: 'emoji:😀' },
    { id: 'emoji-gestures', title: 'Gestures', icon: 'emoji:👍' },
    { id: 'emoji-hearts', title: 'Hearts', icon: 'emoji:❤️' },
  ];

  if (emojis.length === 0) {
    return categories.map(category =>
      makeSet(category.id, 'Emoji', category.title, category.icon, []),
    );
  }

  return categories.map((category, index) =>
    makeSet(
      category.id,
      'Emoji',
      category.title,
      category.icon,
      emojis.slice(index * 24, (index + 1) * 24),
    ),
  );
}

function createEmojiSetsFromInput(
  emojiSets:
    | Array<{
        data: string[];
        icon: `emoji:${string}`;
        id: string;
        title: string;
      }>
    | undefined,
): EmoteMenuSet[] {
  if (!emojiSets?.length) {
    return [];
  }

  return emojiSets.map(category =>
    makeSet(category.id, 'Emoji', category.title, category.icon, category.data),
  );
}

function sortSets(sets: EmoteMenuSet[]): EmoteMenuSet[] {
  return [...sets].sort((left, right) => left.title.localeCompare(right.title));
}

function filterSet(set: EmoteMenuSet, query: string): EmoteMenuSet | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return set;
  }

  const filteredEmotes = set.emotes.filter(emote => {
    if (typeof emote === 'string') {
      return false;
    }

    return emote.name.toLowerCase().includes(normalizedQuery);
  });

  if (filteredEmotes.length === 0) {
    return null;
  }

  return {
    ...set,
    emotes: filteredEmotes,
  };
}

export function buildEmoteMenuProviders(
  input: EmoteMenuDataInput = emptyEmoteData,
): EmoteMenuProvider[] {
  const sevenTvSets = [
    ...groupSevenTvSets('Channel', input.sevenTvChannelEmotes ?? []),
    ...groupSevenTvSets('Global', input.sevenTvGlobalEmotes ?? []),
  ];
  const twitchSets = sortSets([
    makeSet(
      'twitch-channel',
      'Twitch',
      'Channel Emotes',
      'twitch',
      input.twitchChannelEmotes ?? [],
    ),
    makeSet(
      'twitch-global',
      'Twitch',
      'Global Emotes',
      'twitch',
      input.twitchGlobalEmotes ?? [],
    ),
  ]).filter(set => set.emotes.length > 0);
  const ffzSets = sortSets([
    makeSet(
      'ffz-channel',
      'FFZ',
      'Channel Emotes',
      'ffz',
      input.ffzChannelEmotes ?? [],
    ),
    makeSet(
      'ffz-global',
      'FFZ',
      'Global Emotes',
      'ffz',
      input.ffzGlobalEmotes ?? [],
    ),
  ]).filter(set => set.emotes.length > 0);
  const bttvSets = sortSets([
    makeSet(
      'bttv-channel',
      'BTTV',
      'Channel Emotes',
      'bttv',
      input.bttvChannelEmotes ?? [],
    ),
    makeSet(
      'bttv-global',
      'BTTV',
      'Global Emotes',
      'bttv',
      input.bttvGlobalEmotes ?? [],
    ),
  ]).filter(set => set.emotes.length > 0);
  const emojiSets =
    input.emojiSets && input.emojiSets.length > 0
      ? createEmojiSetsFromInput(input.emojiSets)
      : createEmojiSets(input.emojis ?? []);

  const providers: EmoteMenuProvider[] = [
    {
      id: '7TV',
      title: '7TV',
      icon: 'stv',
      sets: sevenTvSets.filter(set => set.emotes.length > 0),
      emoteCount: sevenTvSets.reduce(
        (count, set) => count + set.emotes.length,
        0,
      ),
    },
    {
      id: 'Twitch',
      title: 'Twitch',
      icon: 'twitch',
      sets: twitchSets,
      emoteCount: twitchSets.reduce(
        (count, set) => count + set.emotes.length,
        0,
      ),
    },
    {
      id: 'FFZ',
      title: 'FFZ',
      icon: 'ffz',
      sets: ffzSets,
      emoteCount: ffzSets.reduce((count, set) => count + set.emotes.length, 0),
    },
    {
      id: 'BTTV',
      title: 'BTTV',
      icon: 'bttv',
      sets: bttvSets,
      emoteCount: bttvSets.reduce((count, set) => count + set.emotes.length, 0),
    },
    {
      id: 'Emoji',
      title: 'Emoji',
      icon: 'emoji:😀',
      sets: emojiSets.filter(set => set.emotes.length > 0),
      emoteCount: emojiSets.reduce(
        (count, set) => count + set.emotes.length,
        0,
      ),
    },
  ];

  return providers.filter(provider => provider.sets.length > 0);
}

export function filterProviderSets(
  provider: EmoteMenuProvider | undefined,
  query: string,
): EmoteMenuSet[] {
  if (!provider) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return provider.sets;
  }

  return provider.sets
    .map(set => filterSet(set, normalizedQuery))
    .filter((set): set is EmoteMenuSet => set != null);
}

export interface EmoteMenuListItem {
  key: string;
  rowIndex?: number;
  setId: string;
  type: 'header' | 'row';
  items?: EmotePickerItem[];
}

export function flattenProviderSets(
  sets: EmoteMenuSet[],
  columns: number,
): {
  items: EmoteMenuListItem[];
  setStartIndices: number[];
} {
  const items: EmoteMenuListItem[] = [];
  const setStartIndices: number[] = [];

  sets.forEach(set => {
    setStartIndices.push(items.length);
    items.push({
      key: `${set.id}-header`,
      setId: set.id,
      type: 'header',
    });

    chunk(set.emotes, columns).forEach((row, rowIndex) => {
      items.push({
        key: `${set.id}-row-${rowIndex}`,
        setId: set.id,
        type: 'row',
        rowIndex,
        items: row,
      });
    });
  });

  return { items, setStartIndices };
}

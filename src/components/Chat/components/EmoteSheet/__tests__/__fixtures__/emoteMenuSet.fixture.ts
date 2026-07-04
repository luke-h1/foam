import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';

export function createEmoteMenuSet(icon: EmoteMenuSet['icon']): EmoteMenuSet {
  return {
    id: 'twitch-sub-100',
    provider: 'Twitch',
    title: 'Zoil',
    icon,
    emotes: [],
    shortLabel: 'ZO',
  };
}

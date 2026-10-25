import type { EmoteMenuSet } from '@app/components/chat/components/emote-sheet/util/emoteMenuData';

export function createEmoteMenuSet(icon: EmoteMenuSet['icon']): EmoteMenuSet {
  return {
    id: 'twitch-sub-100',
    provider: 'Twitch',
    title: 'Zoil',
    icon,
    emotes: [],
    shortLabel: 'Zoil',
  };
}

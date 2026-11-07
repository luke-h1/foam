import type { SanitisedEmote } from '@app/types/emote';

export type EmotePickerItem = string | SanitisedEmote;

export function isEmoteEntry(item: EmotePickerItem): item is SanitisedEmote {
  return item instanceof Object && Object.hasOwn(item, 'id');
}

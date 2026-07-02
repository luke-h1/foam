import type { EmojiSanitisedEmote } from '@app/types/emote';

export function createEmojiEmote({
  id,
  name,
  url = `https://example.com/${name}.png`,
}: {
  id: string;
  name: string;
  url?: string;
}): EmojiSanitisedEmote {
  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: '',
    url,
    static_url: url,
    site: 'Emoji',
    width: 72,
    height: 72,
    aspect_ratio: 1,
    zero_width: false,
  };
}

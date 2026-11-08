import type { MessageToken } from '@app/types/chat/messageToken';
import type { EmoteImageVariants } from '@app/types/emote';
import { deriveEmoteImageVariantsFromUrl } from '@app/utils/emote/emote-image-variants/deriveEmoteImageVariantsFromUrl';
import { getChatEmoteDisplayUrl } from '@app/utils/emote/getChatEmoteDisplayUrl';

/**
 * A Twitch token carries only a CDN url, so the variant sets come from that
 * url when the token has none.
 */
export function getSheetEmoteImageVariants(
  emote: MessageToken<'emote'>,
): EmoteImageVariants | null | undefined {
  return emote.image_variants ?? deriveEmoteImageVariantsFromUrl(emote.url);
}

/**
 * The one url rule for the emote sheets: the url they show and copy.
 */
export function getSheetEmoteUrl(
  emote: MessageToken<'emote'>,
  disableAnimations: boolean,
): string {
  return getChatEmoteDisplayUrl(
    {
      image_variants: getSheetEmoteImageVariants(emote),
      static_url: emote.static_url,
      url: emote.url,
    },
    { disableAnimations },
  );
}

import type { EmoteImageVariants } from '@app/types/emote';
import { CHAT_ROW_EMOTE_SCALE } from '@app/utils/emote/resolveEmoteScale';

interface ChatRowEmoteSource {
  image_variants?: EmoteImageVariants | null;
  url?: string | null;
  static_url?: string | null;
}

export function getChatRowEmoteUrl(
  emote: ChatRowEmoteSource,
  { disableAnimations = false }: { disableAnimations?: boolean } = {},
): string {
  if (disableAnimations) {
    return getChatRowStaticEmoteUrl(emote) ?? getChatRowAnimatedEmoteUrl(emote);
  }

  return getChatRowAnimatedEmoteUrl(emote);
}

export function getChatRowAnimatedEmoteUrl(emote: ChatRowEmoteSource): string {
  return (
    emote.image_variants?.animated?.[CHAT_ROW_EMOTE_SCALE] ?? emote.url ?? ''
  );
}

export function getChatRowStaticEmoteUrl(
  emote: ChatRowEmoteSource,
): string | undefined {
  if (!emote.static_url) {
    return emote.static_url ?? undefined;
  }

  return (
    emote.image_variants?.static?.[CHAT_ROW_EMOTE_SCALE] ?? emote.static_url
  );
}

import type {
  EmoteImageVariants,
  SevenTvEmoteSetMetadata,
  SevenTvSanitisedEmote,
} from '@app/types/emote';
import type { StvUser } from '@app/types/seven-tv/users';
import { sevenTvEmotePageUrl } from '@app/utils/emote/cdn/sevenTv';

export interface SevenTvEmoteSource {
  site: SevenTvSanitisedEmote['site'];
  id: string;
  name: string;
  originalName: string;
  creator: string | null;
  url: string;
  staticUrl?: string;
  imageVariants?: EmoteImageVariants;
  flags: number;
  frameCount: number;
  format: string;
  aspectRatio: number;
  zeroWidth: boolean;
  width: number;
  height: number;
  setMetadata: SevenTvEmoteSetMetadata;
  actor?: StvUser;
}

export function buildSevenTvSanitisedEmote(
  source: SevenTvEmoteSource,
): SevenTvSanitisedEmote | null {
  'worklet';

  if (!source.url) {
    return null;
  }

  const result: SevenTvSanitisedEmote = {
    name: source.name,
    id: source.id,
    url: source.url,
    flags: source.flags,
    original_name: source.originalName,
    creator: source.creator,
    emote_link: sevenTvEmotePageUrl(source.id),
    site: source.site,
    provider: '7tv',
    frame_count: source.frameCount,
    format: source.format,
    aspect_ratio: source.aspectRatio,
    zero_width: source.zeroWidth,
    width: source.width,
    height: source.height,
    set_metadata: source.setMetadata,
  };

  if (source.staticUrl !== undefined) {
    result.static_url = source.staticUrl;
  }

  if (source.imageVariants !== undefined) {
    result.image_variants = source.imageVariants;
  }

  if (source.actor !== undefined) {
    result.actor = source.actor;
  }

  return result;
}

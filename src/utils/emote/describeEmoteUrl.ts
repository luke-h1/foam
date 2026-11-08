import type { EmoteImageScale } from '@app/types/emote';

import { parseEmoteCdnUrl } from './cdn/emoteCdnRegistry';
import type { EmoteCdnProvider } from './cdn/types';

type EmoteUrlProvider = EmoteCdnProvider | 'unknown';

export interface EmoteUrlDescriptor {
  provider: EmoteUrlProvider;
  id: string | null;
  scale: EmoteImageScale | null;
  kind: 'animated' | 'static' | null;
}

export function describeEmoteUrl(url: string): EmoteUrlDescriptor {
  const parsed = parseEmoteCdnUrl(url);

  if (parsed) {
    return {
      provider: parsed.cdn.provider,
      id: parsed.id,
      scale: parsed.scale,
      kind: parsed.kind,
    };
  }

  if (/\.gif(?:\?|#|$)/i.test(url)) {
    return { provider: 'unknown', id: null, scale: null, kind: 'animated' };
  }

  return { provider: 'unknown', id: null, scale: null, kind: null };
}

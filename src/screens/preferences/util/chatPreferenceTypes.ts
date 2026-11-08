import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/icon/Icon';

type ProviderPreviewKey =
  | 'show7TvEmotes'
  | 'show7tvBadges'
  | 'showBttvEmotes'
  | 'showBttvBadges'
  | 'showFFzEmotes'
  | 'showFFzBadges'
  | 'showTwitchEmotes'
  | 'showTwitchBadges';

export type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

export type ProviderPreviewVariant = 'badges' | 'emotes';

/**
 * The copy and glyph of one settings row. Both platform section families read
 * it, so the label cannot drift between them.
 */
export interface PreferenceRowCopy {
  title: string;
  subtitle?: string;
  icon: SFSymbol;
  androidIcon?: AndroidSymbol;
}

interface ProviderToggle {
  key: ProviderPreviewKey;
  subtitle: string;
}

export interface ProviderPreferenceSection {
  title: string;
  provider: PreviewProvider;
  emotes: ProviderToggle;
  badges: ProviderToggle;
}

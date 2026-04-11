import { ffzSanitiisedChannelBadges } from '@app/services/__fixtures__/badges/ffz/ffzSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { bttvSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/bttv/bttvSanitisedChannelEmoteSet.fixture';
import { ffzSanitisedChannelEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedChannelEmoteSet.fixture';
import { ffzSanitisedGlobalEmoteSet } from '@app/services/__fixtures__/emotes/ffz/ffzSanitisedGlobalEmoteSet.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';
import { twitchTvSanitisedEmoteSetGlobalFixture } from '@app/services/__fixtures__/emotes/twitch/twitchTvSanitisedEmoteSetGlobal.fixture';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { SanitisedEmote } from '@app/types/emote';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

type ProviderPreviewFixtures = {
  badges: SanitisedBadgeSet[];
  emotes: SanitisedEmote[];
};

function requireValue<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

const sevenTvBadgeFallback: SanitisedBadgeSet = {
  id: 'preview-7tv-badge',
  provider: '7tv',
  set: 'preview-7tv',
  title: '7TV Supporter',
  type: '7TV Badge',
  url: 'https://cdn.7tv.app/emote/01F5PA9D3000034VRANA2SYVDP/4x.avif',
};

// BTTV badge previews have no runtime source or existing fixture in the app yet.
const bttvBadgeFallback: SanitisedBadgeSet = {
  id: 'preview-bttv-badge',
  provider: 'bttv',
  set: 'preview-bttv',
  title: 'BTTV Supporter',
  type: 'BTTV Badge',
  url: 'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x',
};

export const chatPreferencePreviewFixtures: Record<
  PreviewProvider,
  ProviderPreviewFixtures
> = {
  '7tv': {
    badges: [sevenTvBadgeFallback],
    emotes: [
      requireValue(
        sevenTvSanitisedChannelEmoteSetFixture.find(
          emote => emote.name === 'yePls',
        ),
        'Missing 7TV channel preview emote fixture',
      ),
      requireValue(
        seventvSanitiisedGlobalEmoteSetFixture.find(
          emote => emote.name === 'FeelsStrongMan',
        ),
        'Missing 7TV global preview emote fixture',
      ),
    ],
  },
  bttv: {
    badges: [bttvBadgeFallback],
    emotes: [
      requireValue(
        bttvSanitisedChannelEmoteSet.find(emote => emote.name === 'catJAM'),
        'Missing BTTV preview emote fixture: catJAM',
      ),
      requireValue(
        bttvSanitisedChannelEmoteSet.find(emote => emote.name === 'AYAYA'),
        'Missing BTTV preview emote fixture: AYAYA',
      ),
    ],
  },
  ffz: {
    badges: [
      requireValue(
        ffzSanitiisedChannelBadges.find(badge => badge.id === 'vip_badge'),
        'Missing FFZ preview badge fixture',
      ),
    ],
    emotes: [
      requireValue(
        ffzSanitisedChannelEmoteSet.find(emote => emote.name === 'OMEGALUL'),
        'Missing FFZ channel preview emote fixture',
      ),
      requireValue(
        ffzSanitisedGlobalEmoteSet.find(emote => emote.name === 'YooHoo'),
        'Missing FFZ global preview emote fixture',
      ),
    ],
  },
  twitch: {
    badges: [
      requireValue(
        twitchSanitisedGlobalBadges.find(badge => badge.id === 'subscriber_0'),
        'Missing Twitch preview badge fixture: subscriber_0',
      ),
      requireValue(
        twitchSanitisedGlobalBadges.find(badge => badge.id === 'premium_1'),
        'Missing Twitch preview badge fixture: premium_1',
      ),
    ],
    emotes: [
      requireValue(
        twitchTvSanitisedEmoteSetGlobalFixture.find(
          emote => emote.name === 'Kappa',
        ),
        'Missing Twitch preview emote fixture: Kappa',
      ),
      requireValue(
        twitchTvSanitisedEmoteSetGlobalFixture.find(
          emote => emote.name === 'PogChamp',
        ),
        'Missing Twitch preview emote fixture: PogChamp',
      ),
    ],
  },
};

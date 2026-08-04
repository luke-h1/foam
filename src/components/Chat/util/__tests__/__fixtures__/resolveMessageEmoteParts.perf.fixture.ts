import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export const emptyEmotes: SanitisedEmote[] = [];
export const emptyBadges: SanitisedBadgeSet[] = [];

function createBttvEmote(index: number): SanitisedEmote {
  const id = `bttv-${index}`;
  const name = `BTTV${index}`;
  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://betterttv.com/emotes/${id}`,
    url: `https://cdn.betterttv.net/emote/${id}/3x`,
    static_url: `https://cdn.betterttv.net/emote/${id}/3x.png`,
    image_variants: {
      animated: { '2x': `u/${id}/2x`, '3x': `u/${id}/3x` },
      static: { '2x': `u/${id}/2x.png`, '3x': `u/${id}/3x.png` },
    },
    site: index % 2 === 0 ? 'BTTV' : 'Global BTTV',
  };
}

function createTwitchEmote(index: number): SanitisedEmote {
  const id = `twitch-${index}`;
  const name = `Twitch${index}`;
  return {
    id,
    name,
    original_name: name,
    creator: null,
    emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
    url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
    static_url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/3.0`,
    image_variants: {
      animated: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
      },
      static: {
        '2x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/2.0`,
        '4x': `https://static-cdn.jtvnw.net/emoticons/v2/${id}/static/dark/3.0`,
      },
    },
    site: index % 2 === 0 ? 'Twitch Channel' : 'Twitch Global',
  };
}

const bttvEmotes = Array.from({ length: 120 }, (_, index) =>
  createBttvEmote(index),
);
const twitchEmotes = Array.from({ length: 80 }, (_, index) =>
  createTwitchEmote(index),
);

export const denseEmoteData = {
  sevenTvGlobalEmotes: emptyEmotes,
  sevenTvChannelEmotes: emptyEmotes,
  twitchGlobalEmotes: twitchEmotes.filter(
    emote => emote.site === 'Twitch Global',
  ),
  twitchChannelEmotes: twitchEmotes.filter(
    emote => emote.site === 'Twitch Channel',
  ),
  twitchSubscriberEmotes: emptyEmotes,
  ffzChannelEmotes: emptyEmotes,
  ffzGlobalEmotes: emptyEmotes,
  bttvChannelEmotes: bttvEmotes.filter(emote => emote.site === 'BTTV'),
  bttvGlobalEmotes: bttvEmotes.filter(emote => emote.site === 'Global BTTV'),
  twitchChannelBadges: emptyBadges,
  twitchGlobalBadges: emptyBadges,
  ffzChannelBadges: emptyBadges,
  ffzGlobalBadges: emptyBadges,
  chatterinoBadges: emptyBadges,
  bttvBadges: emptyBadges,
};

export const reprocessChatLines = Array.from({ length: 120 }, (_, index) => {
  const bttv = bttvEmotes[index % bttvEmotes.length]?.name ?? 'BTTV0';
  const twitch =
    twitchEmotes[(index * 3) % twitchEmotes.length]?.name ?? 'Twitch0';
  return {
    text: `@viewer${index % 16} ${bttv} combo ${twitch}! https://example.com/${bttv}`,
    userId: `uid-${index % 40}`,
    login: `viewer${index % 16}`,
  };
});

import {
  AllBadges,
  FFZ_AP_COLORS,
  FFZ_AP_HELPERS,
  FfzAp,
  HtmlBadge,
  MessageBadge,
  MessageBadgeType,
} from './messages/types/badges';

export default function createHtmlBadge(
  badges: AllBadges,
  badge: MessageBadge,
): HtmlBadge | null {
  const { type, id, version } = badge;

  switch (type) {
    case MessageBadgeType.TWITCH: {
      const badgeVersion =
        badges.twitchChannel?.[id]?.[version] ||
        badges.twitchGlobal?.[id]?.[version];

      if (!badgeVersion) {
        return null;
      }

      const {
        title,
        image_url_1x: x1,
        image_url_2x: x2,
        image_url_4x: x4,
      } = badgeVersion;

      const srcSet = `${x1} 1x, ${x2} 2x, ${x4} 4x`;
      return {
        id,
        title,
        alt: title,
        src: x1,
        srcSet,
      };
    }

    case MessageBadgeType.BTTV: {
      const badge = badges.bttv?.entries[id];

      if (!badge) {
        return null;
      }

      const {
        badge: { description, svg },
      } = badge;

      return {
        id,
        title: description,
        alt: description,
        src: svg,
      };
    }

    case MessageBadgeType.FFZ: {
      const badge = badges.ffz?.entries[id];

      if (!badge) {
        return null;
      }

      const { title, color, urls } = badge;

      const srcSet = `${urls['1']} 1x, ${urls['2']} 2x, ${urls['4']} 4x`;

      return {
        id,
        title,
        alt: title,
        src: urls['1'],
        srcSet,
        bgColor: color,
      };
    }

    case MessageBadgeType.FFZ_AP: {
      const badge = badges.ffzAp?.entries[id];
      const title = FFZ_AP_HELPERS[id] || FfzAp.Supporter;

      const x1 = `https://api.ffzap.com/v1/user/badge/${id}/1`;
      const x2 = `https://api.ffzap.com/v1/user/badge/${id}/2`;
      const x4 = `https://api.ffzap.com/v1/user/badge/${id}/3`;
      const srcSet = `${x1} 1x, ${x2} 2x, ${x4} 4x`;
      const color =
        badge?.badge_color ||
        FFZ_AP_COLORS[title] ||
        FFZ_AP_COLORS[FfzAp.Supporter];

      return {
        id,
        title,
        alt: title,
        src: x2,
        srcSet,
        bgColor: color,
      };
    }

    case MessageBadgeType.STV: {
      const badge = badges.stv?.entries[id];

      if (!badge) {
        return null;
      }

      const { tooltip, urls } = badge;

      const [[, x1], [, x2], [, x3]] = urls;
      const srcSet = `${x1} 1x, ${x2} 2x, ${x3} 3x`;

      return {
        id,
        title: tooltip,
        alt: tooltip,
        src: x2,
        srcSet,
      };
    }

    case MessageBadgeType.CHATTERINO: {
      const badge = badges.chatterino?.entries[id];

      if (!badge) {
        return null;
      }

      const { image1, image2, image3, tooltip } = badge;

      const srcSet = `${image1} 1x, ${image2} 2x, ${image3} 3x`;

      return {
        id,
        title: tooltip,
        alt: tooltip,
        src: image1,
        srcSet,
      };
    }

    default:
      return null;
  }
}

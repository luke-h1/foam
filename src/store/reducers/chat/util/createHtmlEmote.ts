import { BttvDetailedEmote } from '@app/services/bttvService';
import { DEFAULT_TWITCH_TEMPLATE } from '../config';
import { AllEmotes, HtmlEmote } from '../types/emote';
import { MessagePartType } from './messages/types/messages';

export default function createHtmlEmote(
  emotes: AllEmotes,
  type: MessagePartType,
  id: string,
) {
  switch (type) {
    case MessagePartType.TWITCH_EMOTE: {
      const template = emotes.twitchTemplate || DEFAULT_TWITCH_TEMPLATE;
      const emote = emotes.twitch?.entries[id];
      const title = emote?.name || '';

      const tmp = template
        .replace('{{id}}', id)
        .replace('{{format}}', 'default')
        .replace('{{theme_mode}}', 'dark');

      const x1 = tmp.replace('{{scale}}', '1.0');
      const x2 = tmp.replace('{{scale}}', '2.0');
      const x4 = tmp.replace('{{scale}}', '4.0');

      const ownerId =
        emote?.emote_type === 'follower' ||
        emote?.emote_type === 'subscriptions'
          ? emote?.owner_id
          : undefined;

      return {
        id,
        title,
        alt: title,
        src: x2,
        srcSet: `${x1} 1x, ${x2} 2x, ${x4} 4x`,
        sources: [],
        owner: {
          id: ownerId,
        },
      };
    }

    case MessagePartType.BTTV_EMOTE: {
      type MaybeWithUser = { user?: BttvDetailedEmote['user'] } | undefined;

      const emote =
        emotes.bttvChannel?.entries[id] || emotes.bttvGlobal?.entries[id];

      const title = emote?.code || '';
      const x1 = `//cdn.betterttv.net/emote/${id}/1x`;
      const x2 = `//cdn.betterttv.net/emote/${id}/2x`;
      const x3 = `//cdn.betterttv.net/emote/${id}/3x`;

      return {
        id,
        title,
        alt: title,
        src: x1,
        srcSet: `${x1} 1x, ${x2} 2x, ${x3} 3x`,
        sources: [],
        owner: {
          id: (emote as MaybeWithUser)?.user?.providerId || undefined,
          name: (emote as MaybeWithUser)?.user?.name || undefined,
          displayName: (emote as MaybeWithUser)?.user?.displayName || undefined,
        },
      };
    }

    case MessagePartType.FFZ_EMOTE: {
      const emote =
        emotes.ffzChannel?.entries[id] || emotes.ffzGlobal?.entries[id];

      const title = emote?.name || '';
      const x1 = `//cdn.frankerfacez.com/emote/${id}/1`;
      const x2 = `//cdn.frankerfacez.com/emote/${id}/2`;
      const x4 = `//cdn.frankerfacez.com/emote/${id}/4`;

      return {
        id,
        title,
        alt: title,
        src: x2,
        srcSet: `${x1} 1x, ${x2} 2x, ${x4} 4x`,
        sources: [],
        owner: {
          id: emote?.owner?._id ? `${emote?.owner?._id}` : undefined,
          name: emote?.owner?.name || undefined,
          displayName: emote?.owner?.display_name || undefined,
        },
      };
    }

    case MessagePartType.STV_EMOTE: {
      const emote =
        emotes.stvChannel?.entries[id] || emotes.stvGlobal?.entries[id];

      const title = emote?.name || '';
      let src = '';
      let srcSet = '';

      const sources: HtmlEmote['sources'] = [];

      // assume that every emote has 1x/2x/3x/4x and avif/webp
      const formats = ['avif', 'webp'] as const;

      formats.forEach(format => {
        const x1 = `//cdn.7tv.app/emote/${id}/1x.${format}`;
        const x2 = `//cdn.7tv.app/emote/${id}/2x.${format}`;
        const x3 = `//cdn.7tv.app/emote/${id}/3x.${format}`;
        const x4 = `//cdn.7tv.app/emote/${id}/4x.${format}`;
        const set = `${x1} 1x, ${x2} 2x, ${x3} 3x, ${x4} 4x`;
        sources.push([`image/${format}`, set]);
        if (format === 'webp') {
          src = x1;
          srcSet = set;
        }
      });

      return {
        id,
        title,
        alt: title,
        src,
        srcSet,
        sources,
        owner: {
          id: emote?.data.owner?.id || undefined,
          name: emote?.data.owner?.username || undefined,
          displayName: emote?.data.owner?.display_name || undefined,
        },
      };
    }

    case MessagePartType.EMOJI: {
      const emote = emotes.emoji?.entries[id];

      if (!emote) {
        return null;
      }

      const alt = emote.char;
      const title = typeof emote.name === 'string' ? emote.name : emote.name[0];
      const src = `//cdn.frankerfacez.com/static/emoji/images/twemoji/${emote.codePoints}.png`;
      return {
        id,
        title: `:${title}:`,
        alt,
        src,
        srcSet: `${src} 72w`,
        sources: [],
        owner: {},
      };
    }

    default:
      return null;
  }
}

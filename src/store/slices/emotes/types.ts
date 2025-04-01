import { BttvEmote } from '@app/store/services/types/bttv/emote';
import { FfzEmote } from '@app/store/services/types/ffz/emote';
import { StvEmote } from '@app/store/services/types/stv';
import { TwitchEmote } from '@app/store/services/types/twitch/emote';
import { Emote } from '@app/store/services/types/util';
import { EmoteType } from './constants';

export interface Emoji {
  category: number;
  sort: number;
  char: string;
  name: string | string[];
  codePoints: string;
  variants: string[];
}

export interface AllEmotes {
  twitch?: Emote<TwitchEmote>;
  twitchTemplate?: string;
  bttvGlobal?: Emote<BttvEmote>;
  bttvChannel?: Emote<BttvEmote>;
  ffzGlobal?: Emote<FfzEmote>;
  ffzChannel?: Emote<FfzEmote>;
  stvGlobal?: Emote<StvEmote>;
  stvChannel?: Emote<StvEmote>;
  emoji?: Emote<Emoji>;
}

export interface HtmlEmote {
  id: string;
  title: string;
  alt: string;
  src: string;
  srcSet: string;
  sources: [mime: `image/${string}`, srcSet: string][];
  owner: {
    id?: string;
    name?: string;
    displayName?: string;
  };
}

type LocalStorageEmoteUsageItem = [uses: number, updatedAt: number];

/**
 * `{ [EmoteType]: { [emoteId]: [uses, updatedAt] } }`
 */
export type LocalStorageEmoteUsageStatistic = Record<
  EmoteType,
  Record<string, LocalStorageEmoteUsageItem>
>;

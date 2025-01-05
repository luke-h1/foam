import { BttvBadge } from '@app/services/bttvService';
import { ChatterinoBadge } from '@app/services/chatterinoService';
import { FfzApBadge, FfzBadge } from '@app/services/ffzService';
import { StvBadge } from '@app/services/stvService';
import { TwitchBadgeVersion } from '@app/services/twitchService';
import { Badge } from '@app/services/types/util';

export enum MessageBadgeType {
  TWITCH = 0,
  BTTV = 1,
  FFZ = 2,
  FFZ_AP = 3,
  STV = 4,
  CHATTERINO = 5,
}

// https://github.com/FrankerFaceZ/Add-Ons/blob/master/src/ffzap-core/index.js#L11
export enum FfzAp {
  Developer = 'FFZ:AP Developer',
  Supporter = 'FFZ:AP Supporter',
  Helper = 'FFZ:AP Helper',
}

export const FFZ_AP_HELPERS: Record<string, string> = {
  26964566: FfzAp.Developer,
  11819690: FfzAp.Helper,
  36442149: FfzAp.Helper,
  29519423: FfzAp.Helper,
  22025290: FfzAp.Helper,
  4867723: FfzAp.Helper,
};

export const FFZ_AP_COLORS: Record<string, string> = {
  [FfzAp.Developer]: '#E4107F',
  [FfzAp.Supporter]: '#755000',
};

export type TwitchBadges = Record<string, Record<string, TwitchBadgeVersion>>;

export interface AllBadges {
  twitchGlobal?: TwitchBadges;
  twitchChannel?: TwitchBadges;
  bttv?: Badge<BttvBadge>;
  ffz?: Badge<FfzBadge>;
  ffzAp?: Badge<FfzApBadge>;
  stv?: Badge<StvBadge>;
  chatterino?: Badge<ChatterinoBadge>;
}

export interface MessageBadgeTwitch {
  type: MessageBadgeType.TWITCH;
  id: string;
  version: string;
}

// bttv
export interface MessageBadgeBttv {
  type: MessageBadgeType.BTTV;
  id: string;
}

// ffz
export interface MessageBadgeFfz {
  type: MessageBadgeType.FFZ;
  id: string;
}

// ffz addon pack
export interface MessageBadgeFfzAp {
  type: MessageBadgeType.FFZ_AP;
  id: string;
}

// stv
export interface MessageBadgeStv {
  type: MessageBadgeType.STV;
  id: string;
}

export interface MessageBadgeChatterino {
  type: MessageBadgeType.CHATTERINO;
  id: string;
}

export type MessageBadge =
  | MessageBadgeTwitch
  | MessageBadgeBttv
  | MessageBadgeFfz
  | MessageBadgeFfzAp
  | MessageBadgeStv
  | MessageBadgeChatterino;

export interface HtmlBadge {
  id: string;
  title: string;
  alt: string;
  src: string;
  srcSet?: string;
  bgColor?: string | null;
}

import { components } from "../generated/ffz.generated";
import { FfzRoom } from "./room";

export type FfzEmote = components["schemas"]["Emote"];

type FfzEmoteSet = components["schemas"]["EmoteSet"];

export interface FfzGlobalEmotesResponse {
  default_sets: number[];
  sets: Record<string, FfzEmoteSet>;
  users: Record<string, string[]>;
}

export interface FfzChannelEmotesResponse {
  room: FfzRoom;
  sets: Record<string, FfzEmoteSet>;
}

interface FfzEmojiVariant {
  codePoints: string;
  sheet: [x: number, y: number];
  has: number;
  skinTone: 1 | 2 | 3 | 4 | 5;
  _: number;
  name: string | string[];
}

export interface FfzEmoji {
  category: number;
  sort: number;
  name: string | string[];
  description: string;
  codePoints: string;
  sheet: [x: number, y: number];
  has: number;
  variants: 0 | FfzEmojiVariant[];
}

export interface FfzEmojiResponse {
  v: number;
  n: number;
  b: number;
  t: number;
  o: number;

  /** Categories */
  c: Record<string, string>;
  e: FfzEmoji[];
}

import { definitions } from "../generated/stv.generated";
import { DeepRequired } from "../util";

export type StvGlobalEmotesResponse = DeepRequired<
  definitions["model.EmoteSetModel"]
>;

export type StvChannelEmotesResponse = DeepRequired<
  definitions["model.UserConnectionModel"]
>;

export type StvEmoteSet = DeepRequired<definitions["model.EmoteSetModel"]>;
export type StvEmote = DeepRequired<definitions["model.ActiveEmoteModel"]>;

export interface StvRawBadge {
  id: string;
  name: string;
  tooltip: string;
  urls: ["1" | "2" | "3", string][];
  users: string[];
  misc?: boolean;
}

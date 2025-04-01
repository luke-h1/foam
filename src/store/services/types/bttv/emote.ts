interface BttvBaseEmote {
  id: string;
  code: string;
  imageType: "png" | "gif";
}

export interface BttvCommonEmote extends BttvBaseEmote {
  userId: string;
}

export interface BttvDetailedEmote extends BttvBaseEmote {
  user: {
    id: string;
    name: string;
    displayName: string;
    providerId: string;
  };
}

export type BttvEmote = BttvCommonEmote | BttvDetailedEmote;

export type BttvGlobalEmotesResponse = BttvCommonEmote[];

export interface BttvChannelEmotesResponse {
  id: string;
  bots: string[];
  channelEmotes: BttvDetailedEmote[];
  sharedEmotes: BttvDetailedEmote[];
}

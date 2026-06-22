export interface StreamElementsEmoteStat {
  id: string;
  emote: string;
  amount: number;
}

export interface StreamElementsChatterStat {
  name: string;
  amount: number;
}

/**
 * Public chat statistics for a Twitch channel that uses StreamElements.
 * @see https://api.streamelements.com/kappa/v2/chatstats/:channel/stats
 */
export interface StreamElementsChatStats {
  channel: string;
  totalMessages: number;
  uniqueChatters: number;
  chatters: StreamElementsChatterStat[];
  twitchEmotes: StreamElementsEmoteStat[];
  bttvEmotes: StreamElementsEmoteStat[];
  ffzEmotes: StreamElementsEmoteStat[];
  sevenTVEmotes: StreamElementsEmoteStat[];
}

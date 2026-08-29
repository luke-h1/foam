export interface StreamElementsEmoteStat {
  id: string;
  emote: string;
  amount: number;
}

export interface StreamElementsChatterStat {
  name: string;
  amount: number;
}

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

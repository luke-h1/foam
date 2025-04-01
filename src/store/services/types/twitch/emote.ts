import { components } from "../generated/twitch.generated";

// emote_type: 'globals' | 'smilies' | 'limitedtime' | 'subscriptions' | 'follower' | 'twofactor';
export type TwitchEmote = components["schemas"]["Emote"];

export type TwitchEmoteSetsResponse =
  components["schemas"]["GetEmoteSetsResponse"];

import {
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { applyCheermotesToParts } from '@app/utils/chat/applyCheermotes';
import { getChannelCheermotes } from '@app/utils/chat/cheermoteStore/getChannelCheermotes';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { extractEmotesFromTag } from '@app/utils/chat/extractEmotes/extractEmotesFromTag';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { normaliseChatUsername } from './chatUsernames/normaliseChatUsername';

type EmoteData = ReturnType<typeof getCurrentEmoteData>;

/**
 * Assembles the per-message emote inputs (personal 7TV emotes, scoped Twitch
 * subscriber emotes, emoji) and runs the emote worklet, returning the rendered
 * parts. This is the single place that decides which emote sources feed a
 * message - both the live ingest path and the visible-message reprocess path
 * call through here so the precedence and scoping rules can only diverge in one
 * spot.
 */
export function resolveMessageEmoteParts({
  channelId,
  emoteData,
  show7TvEmotes,
  text,
  userId,
  userLogin,
  userstate,
}: {
  channelId: string;
  emoteData: EmoteData;
  show7TvEmotes: boolean;
  /**
   * The message text, already trimmed by the caller (used both as the worklet
   * input and as the basis for resolving tagged subscriber emotes).
   */
  text: string;
  userId: string | undefined;
  userLogin: string | null | undefined;
  userstate: UserStateTags;
}): ParsedPart[] {
  const personalEmotes =
    userId && show7TvEmotes ? getUserPersonalEmotes(userId, channelId) : [];
  const currentUserLogin = normaliseChatUsername(userLogin);
  const senderLogin = normaliseChatUsername(
    userstate.login || userstate.username,
  );
  const twitchTaggedSubscriberEmotes = extractEmotesFromTag(
    userstate.emotes,
    text,
  );
  const twitchSubscriberEmotes =
    senderLogin && senderLogin === currentUserLogin
      ? emoteData.twitchSubscriberEmotes
      : [];
  const scopedTwitchSubscriberEmotes =
    twitchTaggedSubscriberEmotes.length > 0
      ? [...twitchTaggedSubscriberEmotes, ...twitchSubscriberEmotes]
      : twitchSubscriberEmotes;

  const parts = processEmotesWorklet({
    inputString: text,
    userstate,
    emojiEmotes: chatStore$.emojis.peek(),
    sevenTvGlobalEmotes: emoteData.sevenTvGlobalEmotes,
    sevenTvChannelEmotes: emoteData.sevenTvChannelEmotes,
    sevenTvPersonalEmotes: personalEmotes,
    twitchGlobalEmotes: emoteData.twitchGlobalEmotes,
    twitchChannelEmotes: emoteData.twitchChannelEmotes,
    twitchSubscriberEmotes: scopedTwitchSubscriberEmotes,
    ffzChannelEmotes: emoteData.ffzChannelEmotes,
    ffzGlobalEmotes: emoteData.ffzGlobalEmotes,
    bttvChannelEmotes: emoteData.bttvChannelEmotes,
    bttvGlobalEmotes: emoteData.bttvGlobalEmotes,
  });

  /**
   * The worklet caches parsed parts by text alone, so bits handling stays
   * outside it: applyCheermotesToParts returns a fresh array and never
   * mutates the cached one.
   */
  const bits = Number.parseInt(userstate.bits ?? '', 10);
  if (Number.isFinite(bits) && bits > 0) {
    const cheermotes = getChannelCheermotes(channelId);
    if (cheermotes) {
      return applyCheermotesToParts(parts, cheermotes);
    }
  }

  return parts;
}

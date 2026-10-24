import {
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channel-load';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { applyCheermotesToParts } from '@app/utils/chat/apply-cheermotes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { getChannelCheermotes } from '@app/utils/chat/cheermote-store/get-channel-cheermotes';
import { processEmotes } from '@app/utils/chat/emote-processor';
import { extractEmotesFromTag } from '@app/utils/chat/extract-emotes/extract-emotes-from-tag';
import type { MessageToken } from '@app/utils/chat/message-token';

import { parseTwitchGifsTag } from './extract-gifs/parse-twitch-gifs-tag';
import { splitMessageAroundGifs } from './extract-gifs/split-message-around-gifs';

type EmoteData = ReturnType<typeof getCurrentEmoteData>;

interface ResolveMessageEmotePartsOptions {
  channelId: string;
  emoteData: EmoteData;
  show7TvEmotes: boolean;
  showChatGifs?: boolean;
  taggedSubscriberEmotes?: ReturnType<typeof extractEmotesFromTag>;
  /**
   * The message text, already trimmed by the caller (used both as the worklet
   * input and as the basis for resolving tagged subscriber emotes).
   */
  text: string;
  userId?: string;
  userLogin?: string | null;
  userstate: UserStateTags;
}

interface ProcessTextChunkOptions {
  emoteData: EmoteData;
  personalEmotes: ReturnType<typeof getUserPersonalEmotes>;
  scopedTwitchSubscriberEmotes: EmoteData['twitchSubscriberEmotes'];
  text: string;
  userstate: UserStateTags;
}

function processTextChunk({
  emoteData,
  personalEmotes,
  scopedTwitchSubscriberEmotes,
  text,
  userstate,
}: ProcessTextChunkOptions): MessageToken[] {
  return processEmotes({
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
}

/**
 * The single place that decides which emote sources feed a message, so live
 * ingest and the visible-message reprocess cannot diverge.
 */
export function resolveMessageEmoteParts({
  channelId,
  emoteData,
  show7TvEmotes,
  showChatGifs = false,
  taggedSubscriberEmotes,
  text,
  userId,
  userLogin,
  userstate,
}: ResolveMessageEmotePartsOptions): MessageToken[] {
  const personalEmotes =
    userId && show7TvEmotes ? getUserPersonalEmotes(userId, channelId) : [];

  const currentUserLogin = normaliseChatUsername(userLogin);

  const senderLogin = normaliseChatUsername(
    userstate.login || userstate.username,
  );

  const twitchTaggedSubscriberEmotes =
    taggedSubscriberEmotes ?? extractEmotesFromTag(userstate.emotes, text);

  const twitchSubscriberEmotes =
    senderLogin && senderLogin === currentUserLogin
      ? emoteData.twitchSubscriberEmotes
      : [];

  // Keep the cached tagged-emotes array's identity when there is nothing to
  // merge. A fresh array would miss the WeakMap content-id interning.
  let scopedTwitchSubscriberEmotes = twitchSubscriberEmotes;

  if (twitchTaggedSubscriberEmotes.length > 0) {
    scopedTwitchSubscriberEmotes =
      twitchSubscriberEmotes.length > 0
        ? [...twitchTaggedSubscriberEmotes, ...twitchSubscriberEmotes]
        : twitchTaggedSubscriberEmotes;
  }

  const gifSpans = showChatGifs ? parseTwitchGifsTag(userstate.gifs, text) : [];

  const textChunkOptions: ProcessTextChunkOptions = {
    emoteData,
    personalEmotes,
    scopedTwitchSubscriberEmotes,
    text,
    userstate,
  };

  let tokens: MessageToken[];

  if (gifSpans.length === 0) {
    tokens = processTextChunk(textChunkOptions);
  } else {
    // Emote tag positions are for the full body; after a GIF split, match by
    // name from the subscriber pool already built above instead of re-using
    // those offsets on a shorter chunk.
    const chunkedUserState = {
      ...userstate,
      emotes: undefined,
    };
    tokens = [];

    for (const segment of splitMessageAroundGifs(text, gifSpans)) {
      if (segment.kind === 'gif') {
        tokens.push({
          type: 'gif',
          content: segment.content,
          gifId: segment.gifId,
          url: segment.url,
        });
        continue;
      }

      if (!segment.text) {
        continue;
      }

      tokens.push(
        ...processTextChunk({
          ...textChunkOptions,
          text: segment.text,
          userstate: chunkedUserState,
        }),
      );
    }
  }

  // The worklet caches parsed tokens by text alone, so bits handling stays
  // outside it and never mutates the cached array.
  const bits = Number.parseInt(userstate.bits ?? '', 10);

  const cheermotes =
    Number.isFinite(bits) && bits > 0
      ? getChannelCheermotes(channelId)
      : undefined;

  return cheermotes ? applyCheermotesToParts(tokens, cheermotes) : tokens;
}

import type { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import { getUserPersonalEmotes } from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import { applyCheermotesToTokens } from '@app/utils/chat/applyCheermotesToTokens';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getChannelCheermotes } from '@app/utils/chat/cheermote-store/getChannelCheermotes';
import { processEmotes } from '@app/utils/chat/emoteProcessor';
import { extractEmotesFromTag } from '@app/utils/chat/extract-emotes/extractEmotesFromTag';
import { parseTwitchGifsTag } from '@app/utils/chat/extract-gifs/parseTwitchGifsTag';
import { splitMessageAroundGifs } from '@app/utils/chat/extract-gifs/splitMessageAroundGifs';

type EmoteData = ReturnType<typeof getCurrentEmoteData>;

interface ResolveMessageEmoteTokensOptions {
  channelId: string;
  emoteData: EmoteData;
  show7TvEmotes: boolean;
  showChatGifs?: boolean;
  taggedSubscriberEmotes?: ReturnType<typeof extractEmotesFromTag>;
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

export function resolveMessageEmoteTokens({
  channelId,
  emoteData,
  show7TvEmotes,
  showChatGifs = false,
  taggedSubscriberEmotes,
  text,
  userId,
  userLogin,
  userstate,
}: ResolveMessageEmoteTokensOptions): MessageToken[] {
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

  const bits = Number.parseInt(userstate.bits ?? '', 10);

  const cheermotes =
    Number.isFinite(bits) && bits > 0
      ? getChannelCheermotes(channelId)
      : undefined;

  return cheermotes ? applyCheermotesToTokens(tokens, cheermotes) : tokens;
}

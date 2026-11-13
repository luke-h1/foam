import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedEmote } from '@app/types/emote';
import {
  matchMentionLogin,
  type MentionLoginMatch,
} from '@app/utils/chat/chat-usernames/twitchLogin';
import { getEmoteArrayContentKey } from '@app/utils/chat/emoteArrayContentKey';
import { parseWordLinkTokens } from '@app/utils/chat/parse-word-link-tokens/parseWordLinkTokens';
import { evictOldestWhenFull } from '@app/utils/collection/evictOldestWhenFull';

import { applyMentionLoginCasing } from './resolve-mention-login/applyMentionLoginCasing';
import { stripInvisibleChars } from './stripInvisibleChars';

interface EmoteProcessorParams {
  inputString: string;
  userstate: UserStateTags | null;
  emojiEmotes?: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes?: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  twitchSubscriberEmotes?: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
}

/**
 * Two generations of 500 entries instead of one 1000-entry map that deletes
 * its oldest key on every write. A flood of distinct lines paid about 200ns
 * per message for that delete. Dropping a whole generation costs almost
 * nothing.
 *
 * One generation pair per (collection, scoped key) epoch, so the parse cache
 * keys on `cleanInput` alone. The old single key concatenated the collection
 * key onto every message, which allocated a message-sized string per line.
 * Epochs hang off the collection in a WeakMap, so an evicted collection
 * releases its cache with it, and shared chat's two channels keep separate
 * epochs instead of thrashing one.
 */
const CACHE_GENERATION_SIZE = 500;

interface TokenCacheEpoch {
  current: Map<string, MessageToken[]>;
  previous: Map<string, MessageToken[]>;
}

const MAX_EPOCHS_PER_COLLECTION = 8;

const epochsByCollection = new WeakMap<
  EmoteCollection,
  Map<string, TokenCacheEpoch>
>();

function getTokenCacheEpoch(
  collection: EmoteCollection,
  scopedEmoteKey: string,
): TokenCacheEpoch {
  let epochs = epochsByCollection.get(collection);

  if (!epochs) {
    epochs = new Map();
    epochsByCollection.set(collection, epochs);
  }

  let epoch = epochs.get(scopedEmoteKey);

  if (!epoch) {
    epoch = { current: new Map(), previous: new Map() };
    evictOldestWhenFull(epochs, MAX_EPOCHS_PER_COLLECTION);
    epochs.set(scopedEmoteKey, epoch);
  }

  return epoch;
}

const baseCollectionCache = new Map<string, EmoteCollection>();

/**
 * One token per emote object, shared by every message and cache entry that
 * matches it. Keyed weakly, so an emote set change releases the old tokens.
 * A token also depends on the matched word (`content`, and `original_name`
 * for emoji), so a word that differs from the stored token's gets its own.
 */
const internedEmoteTokens = new WeakMap<
  SanitisedEmote,
  MessageToken<'emote'>
>();

const MAX_BASE_COLLECTION_CACHE_SIZE = 4;

const scopedLookupCache = new Map<
  string,
  (name: string) => SanitisedEmote | undefined
>();

const MAX_SCOPED_LOOKUP_CACHE_SIZE = 256;

interface EmoteCollection {
  cacheKey: string;
  emojiMap: ReadonlyMap<string, SanitisedEmote>;
  emoteMap: ReadonlyMap<string, SanitisedEmote>;
  getEmote: (name: string) => SanitisedEmote | undefined;
}

let lastBaseKeyInputs: SanitisedEmote[][] | null = null;
let lastBaseKey = '';

function getBaseCollectionKey(
  emojiEmotes: SanitisedEmote[],
  sevenTvGlobalEmotes: SanitisedEmote[],
  sevenTvChannelEmotes: SanitisedEmote[],
  twitchGlobalEmotes: SanitisedEmote[],
  twitchChannelEmotes: SanitisedEmote[],
  ffzChannelEmotes: SanitisedEmote[],
  ffzGlobalEmotes: SanitisedEmote[],
  bttvChannelEmotes: SanitisedEmote[],
  bttvGlobalEmotes: SanitisedEmote[],
): string {
  // One-entry identity memo: nine pointer compares per message instead of
  // nine WeakMap reads plus an array and a join.
  const last = lastBaseKeyInputs;

  if (
    last &&
    last[0] === emojiEmotes &&
    last[1] === sevenTvGlobalEmotes &&
    last[2] === sevenTvChannelEmotes &&
    last[3] === twitchGlobalEmotes &&
    last[4] === twitchChannelEmotes &&
    last[5] === ffzChannelEmotes &&
    last[6] === ffzGlobalEmotes &&
    last[7] === bttvChannelEmotes &&
    last[8] === bttvGlobalEmotes
  ) {
    return lastBaseKey;
  }

  // Content-derived so a rebuilt array with unchanged emotes keys the same -
  // identity keying re-parsed the whole window (~800ms) after an emote_set.update.
  const key = [
    getEmoteArrayContentKey(emojiEmotes),
    getEmoteArrayContentKey(sevenTvGlobalEmotes),
    getEmoteArrayContentKey(sevenTvChannelEmotes),
    getEmoteArrayContentKey(twitchGlobalEmotes),
    getEmoteArrayContentKey(twitchChannelEmotes),
    getEmoteArrayContentKey(ffzChannelEmotes),
    getEmoteArrayContentKey(ffzGlobalEmotes),
    getEmoteArrayContentKey(bttvChannelEmotes),
    getEmoteArrayContentKey(bttvGlobalEmotes),
  ].join('|');

  lastBaseKeyInputs = [
    emojiEmotes,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  ];

  lastBaseKey = key;
  return key;
}

function setIfMissing(
  emoteMap: Map<string, SanitisedEmote>,
  emotes: SanitisedEmote[],
): void {
  emotes.forEach(emote => {
    if (!emoteMap.has(emote.name)) {
      emoteMap.set(emote.name, emote);
    }
  });
}

function getBaseCollection({
  bttvChannelEmotes,
  bttvGlobalEmotes,
  emojiEmotes,
  ffzChannelEmotes,
  ffzGlobalEmotes,
  sevenTvChannelEmotes,
  sevenTvGlobalEmotes,
  twitchChannelEmotes,
  twitchGlobalEmotes,
}: Pick<
  Required<EmoteProcessorParams>,
  | 'bttvChannelEmotes'
  | 'bttvGlobalEmotes'
  | 'emojiEmotes'
  | 'ffzChannelEmotes'
  | 'ffzGlobalEmotes'
  | 'sevenTvChannelEmotes'
  | 'sevenTvGlobalEmotes'
  | 'twitchChannelEmotes'
  | 'twitchGlobalEmotes'
>): EmoteCollection {
  const cacheKey = getBaseCollectionKey(
    emojiEmotes,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  );

  const cached = baseCollectionCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const emoteMap = new Map<string, SanitisedEmote>();
  const emojiMap = new Map<string, SanitisedEmote>();

  setIfMissing(emoteMap, sevenTvChannelEmotes);
  setIfMissing(emoteMap, twitchChannelEmotes);
  setIfMissing(emoteMap, ffzChannelEmotes);
  setIfMissing(emoteMap, bttvChannelEmotes);
  setIfMissing(emoteMap, emojiEmotes);
  setIfMissing(emoteMap, sevenTvGlobalEmotes);
  setIfMissing(emoteMap, twitchGlobalEmotes);
  setIfMissing(emoteMap, ffzGlobalEmotes);
  setIfMissing(emoteMap, bttvGlobalEmotes);

  emojiEmotes.forEach(emote => {
    if (emote.provider !== 'emoji') {
      return;
    }

    const emojiHexcode = emote.emoji_hexcode ?? emote.id;

    if (!emojiMap.has(emojiHexcode)) {
      emojiMap.set(emojiHexcode, emote);
    }
  });

  const collection = {
    cacheKey,
    emojiMap,
    emoteMap,
    getEmote: (name: string) => emoteMap.get(name),
  };

  if (baseCollectionCache.size >= MAX_BASE_COLLECTION_CACHE_SIZE) {
    evictOldestBaseCollection();
  }

  baseCollectionCache.set(cacheKey, collection);
  return collection;
}

function evictOldestBaseCollection(): void {
  const firstKey = baseCollectionCache.keys().next().value;

  if (!firstKey) {
    return;
  }

  baseCollectionCache.delete(firstKey);
  const evictedPrefix = `${firstKey}:`;

  scopedLookupCache.forEach((_, scopedKey) => {
    if (scopedKey.startsWith(evictedPrefix)) {
      scopedLookupCache.delete(scopedKey);
    }
  });
}

const contentIdByEmoteArray = new WeakMap<SanitisedEmote[], number>();
const contentIdByIds = new Map<string, number>();
const MAX_CONTENT_ID_CACHE_SIZE = 32;
let nextContentId = 0;

/**
 * Small integer standing in for the array's contents - spelling the ids into
 * the key scaled per-message cost with the account's unlocked emotes.
 */
function mintEmoteContentId(idsKey: string): number {
  nextContentId += 1;

  /**
   * Eviction mints a fresh id for contents seen again, costing a parse-cache
   * miss and never a wrong hit.
   */
  evictOldestWhenFull(contentIdByIds, MAX_CONTENT_ID_CACHE_SIZE);

  contentIdByIds.set(idsKey, nextContentId);
  return nextContentId;
}

function getEmoteContentId(emotes: SanitisedEmote[]): number {
  if (emotes.length === 0) {
    return 0;
  }

  const cached = contentIdByEmoteArray.get(emotes);

  if (cached !== undefined) {
    return cached;
  }

  const idsKey = emotes.map(emote => emote.id).join(',');
  const contentId = contentIdByIds.get(idsKey) ?? mintEmoteContentId(idsKey);

  contentIdByEmoteArray.set(emotes, contentId);
  return contentId;
}

function getScopedEmoteKey(
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
): string {
  return `${getEmoteContentId(sevenTvPersonalEmotes)}|${getEmoteContentId(
    twitchSubscriberEmotes,
  )}`;
}

function createScopedEmoteLookup(
  baseCollection: EmoteCollection,
  sevenTvPersonalEmotes: SanitisedEmote[],
  twitchSubscriberEmotes: SanitisedEmote[],
  scopedEmoteKey: string,
): (name: string) => SanitisedEmote | undefined {
  if (
    sevenTvPersonalEmotes.length === 0 &&
    twitchSubscriberEmotes.length === 0
  ) {
    return baseCollection.getEmote;
  }

  const cacheKey = `${baseCollection.cacheKey}:${scopedEmoteKey}`;
  const cached = scopedLookupCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const personalEmoteMap = new Map<string, SanitisedEmote>();
  const subscriberEmoteMap = new Map<string, SanitisedEmote>();
  setIfMissing(personalEmoteMap, sevenTvPersonalEmotes);
  setIfMissing(subscriberEmoteMap, twitchSubscriberEmotes);

  const lookup = (name: string) =>
    personalEmoteMap.get(name) ??
    subscriberEmoteMap.get(name) ??
    baseCollection.emoteMap.get(name);

  evictOldestWhenFull(scopedLookupCache, MAX_SCOPED_LOOKUP_CACHE_SIZE);

  scopedLookupCache.set(cacheKey, lookup);

  return lookup;
}

// Pure-ASCII words can never match the emoji map, so skip the per-word
// code-point expansion for them.
function hasNonAsciiChar(word: string): boolean {
  for (let i = 0; i < word.length; i += 1) {
    if (word.charCodeAt(i) > 0x7f) {
      return true;
    }
  }

  return false;
}

function skipWhitespaceForward(tokens: MessageToken[], from: number): number {
  let index = from;

  while (index < tokens.length && isWhitespacePart(tokens[index])) {
    index += 1;
  }

  return index;
}

function skipWhitespaceBackward(tokens: MessageToken[], from: number): number {
  let index = from;

  while (index >= 0 && isWhitespacePart(tokens[index])) {
    index -= 1;
  }

  return index;
}

/**
 * Emoji are keyed by their code points. Retry without the FE0F variation
 * selector, which clients send but the dataset leaves off.
 */
function findEmojiForWord(
  emojiMap: ReadonlyMap<string, SanitisedEmote>,
  word: string,
): SanitisedEmote | undefined {
  const upperWord = [...word]
    .map(char => char.codePointAt(0)?.toString(16).toUpperCase() || '')
    .join('-');

  const exact = emojiMap.get(upperWord);

  if (exact || !upperWord.includes('FE0F')) {
    return exact;
  }

  return emojiMap.get(
    upperWord
      .split('-')
      .filter(hex => hex !== 'FE0F')
      .join('-'),
  );
}

const BACKWARD_EMOTE_MODIFIERS = new Set(['w!', 'h!', 'v!']);

function isWhitespacePart(token: MessageToken | undefined): boolean {
  return token?.type === 'text' && /^\s+$/.test(token.content);
}

function stackZeroWidthEmote(
  out: MessageToken[],
  token: MessageToken<'emote'>,
): boolean {
  let anchor = out.length - 1;

  while (anchor >= 0 && isWhitespacePart(out[anchor])) {
    anchor -= 1;
  }

  const base = anchor >= 0 ? out[anchor] : undefined;

  if (base?.type !== 'emote' || base.zero_width) {
    return false;
  }

  out.length = anchor + 1;

  // Skip duplicate overlay ids (double decode + darkened alpha).
  const alreadyStacked =
    base.id === token.id ||
    (base.overlaid?.some(overlay => overlay.id === token.id) ?? false);

  if (alreadyStacked) {
    return true;
  }

  // An interned base is shared by every message that uses the emote, so the
  // first overlay copies it. Only that per-message copy carries `overlaid`.
  if (base.overlaid) {
    base.overlaid.push(token);
  } else {
    out[anchor] = { ...base, overlaid: [token] };
  }

  return true;
}

function applyEmoteCompositionPass(tokens: MessageToken[]): MessageToken[] {
  const out: MessageToken[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (
      token.type === 'emote' &&
      token.zero_width &&
      stackZeroWidthEmote(out, token)
    ) {
      continue;
    }

    const content =
      token.type === 'emote' || token.type === 'text'
        ? token.content.trim()
        : '';

    const modifierTarget =
      content && BACKWARD_EMOTE_MODIFIERS.has(content)
        ? skipWhitespaceForward(tokens, index + 1)
        : -1;

    if (tokens[modifierTarget]?.type === 'emote') {
      index = modifierTarget - 1;
      continue;
    }

    const ffzAnchor =
      content.startsWith('ffz') && content.length > 3
        ? skipWhitespaceBackward(out, out.length - 1)
        : -1;

    if (ffzAnchor >= 0 && out[ffzAnchor]?.type === 'emote') {
      out.length = ffzAnchor + 1;
      continue;
    }

    out.push(token);
  }

  return out;
}

function pushMentionParts(
  result: MessageToken[],
  { login, rest }: MentionLoginMatch,
): void {
  result.push({ type: 'mention', content: `@${login}` });

  if (rest) {
    result.push({ type: 'text', content: rest });
  }
}

/**
 * Same set as the `\s` regex class. A test checks every UTF-16 code unit
 * against `\s`.
 */
function isWhitespaceCode(code: number): boolean {
  if (code <= 0x20) {
    return code === 0x20 || (code >= 0x09 && code <= 0x0d);
  }

  if (code < 0xa0) {
    return false;
  }

  return (
    code === 0xa0 ||
    code === 0x16_80 ||
    (code >= 0x20_00 && code <= 0x20_0a) ||
    code === 0x20_28 ||
    code === 0x20_29 ||
    code === 0x20_2f ||
    code === 0x20_5f ||
    code === 0x30_00 ||
    code === 0xfe_ff
  );
}

function getCachedTokens(
  epoch: TokenCacheEpoch,
  cleanInput: string,
): MessageToken[] | undefined {
  const current = epoch.current.get(cleanInput);

  if (current) {
    return current;
  }

  const previous = epoch.previous.get(cleanInput);

  if (previous) {
    setCachedTokens(epoch, cleanInput, previous);
  }

  return previous;
}

function setCachedTokens(
  epoch: TokenCacheEpoch,
  cleanInput: string,
  tokens: MessageToken[],
): void {
  if (epoch.current.size >= CACHE_GENERATION_SIZE) {
    epoch.previous = epoch.current;
    epoch.current = new Map();
  }

  epoch.current.set(cleanInput, tokens);
}

/**
 * The first-character checks skip the mention and link regexes for most
 * words: a mention starts with `@` and a link starts with `http`.
 */
function pushWordTokens(
  result: MessageToken[],
  word: string,
  getEmote: (name: string) => SanitisedEmote | undefined,
  emojiMap: ReadonlyMap<string, SanitisedEmote>,
): void {
  const firstCode = word.charCodeAt(0);
  const mention = firstCode === 0x40 ? matchMentionLogin(word) : null;

  if (mention) {
    pushMentionParts(result, mention);
    return;
  }

  const linkParts =
    firstCode === 0x68 || firstCode === 0x48 ? parseWordLinkTokens(word) : null;

  if (linkParts) {
    result.push(...linkParts);
    return;
  }

  let emote = getEmote(word);

  if (!emote && word.length <= 8 && hasNonAsciiChar(word)) {
    emote = findEmojiForWord(emojiMap, word);
  }

  if (!emote) {
    result.push({ type: 'text', content: word });
    return;
  }

  const interned = internedEmoteTokens.get(emote);

  if (interned?.content === word) {
    result.push(interned);
    return;
  }

  const token = createEmoteToken(emote, word);

  if (!interned) {
    internedEmoteTokens.set(emote, token);
  }

  result.push(token);
}

function createEmoteToken(
  emote: SanitisedEmote,
  word: string,
): MessageToken<'emote'> {
  return {
    id: emote.id,
    name: emote.name,
    type: 'emote' as const,
    content: word,
    creator: emote.creator || '',
    emote_link: emote.emote_link || '',
    original_name:
      emote.provider === 'emoji' && !word.startsWith(':')
        ? word
        : emote.original_name || '',
    site: emote.site || '',
    static_url: emote.static_url,
    thumbnail: emote.url,
    url: emote.url,
    width: emote.width,
    height: emote.height,
    aspect_ratio: emote.aspect_ratio,
    zero_width: emote.zero_width,
  };
}

/**
 * One shared default. A new `[]` per call failed the identity check in
 * `getBaseCollectionKey`, so every message rebuilt the collection key.
 */
const NO_EMOTES: SanitisedEmote[] = [];

const SPACE_TOKEN: MessageToken = { type: 'text', content: ' ' };

export const processEmotes = (params: EmoteProcessorParams): MessageToken[] => {
  const {
    inputString,
    emojiEmotes = NO_EMOTES,
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvPersonalEmotes = NO_EMOTES,
    twitchGlobalEmotes,
    twitchChannelEmotes,
    twitchSubscriberEmotes = NO_EMOTES,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    bttvChannelEmotes,
    bttvGlobalEmotes,
  } = params;

  const cleanInput = stripInvisibleChars(inputString);

  if (!cleanInput) {
    return [{ type: 'text', content: cleanInput }];
  }

  const baseCollection = getBaseCollection({
    bttvChannelEmotes,
    bttvGlobalEmotes,
    emojiEmotes,
    ffzChannelEmotes,
    ffzGlobalEmotes,
    sevenTvChannelEmotes,
    sevenTvGlobalEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
  });

  const scopedEmoteKey = getScopedEmoteKey(
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
  );

  const epoch = getTokenCacheEpoch(baseCollection, scopedEmoteKey);

  const cached = getCachedTokens(epoch, cleanInput);

  if (cached) {
    return applyMentionLoginCasing(cached);
  }

  const getEmote = createScopedEmoteLookup(
    baseCollection,
    sevenTvPersonalEmotes,
    twitchSubscriberEmotes,
    scopedEmoteKey,
  );

  const emojiMap = baseCollection.emojiMap;
  const result: MessageToken[] = [];
  let start = 0;

  // Gives the same runs as `split(/(\s+)/)` without the regex and the array.
  while (start < cleanInput.length) {
    const isSpace = isWhitespaceCode(cleanInput.charCodeAt(start));
    let end = start + 1;

    while (
      end < cleanInput.length &&
      isWhitespaceCode(cleanInput.charCodeAt(end)) === isSpace
    ) {
      end += 1;
    }

    if (isSpace) {
      // A single plain space is the most common token in chat; tokens are
      // never mutated (overlays copy on write), so one shared object is safe.
      result.push(
        end - start === 1 && cleanInput.charCodeAt(start) === 0x20
          ? SPACE_TOKEN
          : { type: 'text', content: cleanInput.slice(start, end) },
      );
    } else {
      pushWordTokens(result, cleanInput.slice(start, end), getEmote, emojiMap);
    }

    start = end;
  }

  const composedResult = applyEmoteCompositionPass(result);
  setCachedTokens(epoch, cleanInput, composedResult);

  return applyMentionLoginCasing(composedResult);
};

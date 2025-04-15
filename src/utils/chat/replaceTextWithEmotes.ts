import { useChatStore } from '@app/store/chatStore';
import { ChatUserstate } from 'tmi.js';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';
import { SanitisiedEmoteSet } from '@app/services';
import { findBitEntryAndTier } from '../twitch';

export function useReplaceTextWithEmotes(
  str: string,
  ttvEmoteData: unknown[],
  userstate: ChatUserstate,
) {
  const {
    sevenTvGlobalEmotes,
    sevenTvChannelEmotes,
    twitchChannelEmotes,
    twitchGlobalEmotes,
    ttvUsers,
    bits,
  } = useChatStore();

  const allEmotes = [...sevenTvChannelEmotes, ...ttvEmoteData];

  const twitchEmotes = [...twitchChannelEmotes, ...twitchGlobalEmotes];

  const emoteSplit = splitTextWithTwemoji(str);

  // work out types
  let foundMessageSender = null;

  if (userstate) {
    foundMessageSender = ttvUsers.find(
      u => u.name === `@${userstate.username}`,
    );
  }

  const replacedParts = [];

  /**
   * Detect emojis
   * @example :wave: -> 👋
   */

  for (let i = 0; i < emoteSplit.length; i += 1) {
    let part = emoteSplit[i];

    let foundEmote: SanitisiedEmoteSet;

    let foundUser;

    let emoteType = '';

    if (!foundEmote && part?.emoji) {
      foundEmote = {};
      foundEmote.name = part.emoji;
      emoteType = 'site';
      foundEmote.url = part.image;
      foundEmote.emote_link = part.image;
    }

    if (!foundEmote) {
      if (userstate && userstate.bits) {
        let match = part?.match(/^([a-zA-Z]+)(\d+)$/);

        if (match) {
          let prefix = match[1]; // Prefix
          let _bits = match[2]; // Amount

          const result = findBitEntryAndTier(prefix, _bits, bits);

          if (result) {
            foundEmote = {
              name: result.name,
              url: result.tier?.url,
              site: 'TTV',
              color: result.tier?.color,
              bits: `<div class="bits-number">${bits}</div>`,
            };

            emoteType = 'Bits';
          }
        }
      }
    }

    // twitch emotes

    if (!foundEmote) {
      // eslint-disable-next-line no-restricted-syntax
      for (const emote of twitchEmotes) {
        if (emote.name && part === emote.name.trim()) {
          foundEmote = emote;
          emoteType = emote.site;
          break;
        }
      }
    }

    // personal 7tv emotes
  }
}

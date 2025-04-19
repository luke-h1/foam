/* eslint-disable no-restricted-syntax */
import { useChatStore } from '@app/store/chatStore';
import { ChatUserstate } from 'tmi.js';
import { splitTextWithTwemoji } from './splitTextWithTwemoji';
import { SanitisiedEmoteSet } from '@app/services';
import { findBitEntryAndTier } from '../twitch';
import { sanitizeInput } from './sanitizeInput';

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

  const nonGlobalEmotes = [];

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
          // eslint-disable-next-line no-underscore-dangle
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
    if (!foundEmote) {
      if (foundMessageSender && foundMessageSender.cosmetics) {
        if (
          foundMessageSender.cosmetics.personal_emotes &&
          foundMessageSender.cosmetics.personal_emotes.length > 0
        ) {
          // eslint-disable-next-line no-restricted-syntax
          for (const emote of foundMessageSender.cosmetics.personal_emotes) {
            if (emote.name && part === sanitizeInput(emote.name)) {
              foundEmote = emote;
              emoteType = 'Personal';
              break;
            }
          }
        }
      }
    }

    // non-global emotes

    if (!foundEmote) {
      for (const emote of nonGlobalEmotes) {
        if (emote.name && part === sanitizeInput(emote.name)) {
          foundEmote = emote;
          emoteType = emote.site;
          break;
        }
      }
    }

    // search in all emotes

    // search for user
    if (!foundEmote && (!userstate || !userstate.noMention)) {
      for (const user of ttvUsers) {
        const userName = user.name.toLowerCase();
        const regex = new RegExp(
          `^(${userName.slice(1)}[,]?|${userName},?)$`,
          'i',
        );

        if (regex.test(part)) {
          foundUser = user;
          break;
        }
      }
    }

    if (foundEmote) {
      let emoteMarkup = '';

      if (emoteType !== 'Bits' && !part.emoji) {
        for (const key in foundEmote) {
          if (typeof foundEmote[key] === 'string') {
            foundEmote[key] = sanitizeInput(foundEmote[key]);
          }
        }
      }

      let additionalInfo = '';
      if (
        foundEmote.original_name &&
        foundEmote.name !== foundEmote.original_name
      ) {
        additionalInfo += `, Alias of: ${foundEmote.original_name}`;
      }

      let desired_height = 5;

      if (userstate && userstate.title) {
        desired_height = 10;
      }

      let creator = foundEmote.creator
        ? `Created by: ${foundEmote.creator}`
        : '';
    }
  }
}

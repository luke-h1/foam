/* eslint-disable @typescript-eslint/unified-signatures */
import { MessagePartType } from '../services/types/messages';
import { StvEmote } from '../services/types/stv';
import {
  BTTV_EMOTES_MODIFIERS,
  FFZ_EMOTES_MODIFIERS,
} from '../slices/emotes/constants';

const isBttvEmoteModifier = (code: string): false | string =>
  BTTV_EMOTES_MODIFIERS[code] || false;

// ignore ffzEmote.margins, extra_width and shrink_to_fit for now
const isFfzEmoteModifier = (id: string): false | string =>
  FFZ_EMOTES_MODIFIERS[id] || false;

// https://github.com/FrankerFaceZ/Add-Ons/blob/master/src/7tv-emotes/modules/emotes.js#L187
const isStvEmoteModifier = (emote: StvEmote) =>
  // eslint-disable-next-line no-bitwise
  emote.flags === 1 << 0 ? '0' : false;

function isEmoteModifier(
  code: string,
  type: MessagePartType.BTTV_EMOTE,
): false | string;
function isEmoteModifier(
  id: string,
  type: MessagePartType.FFZ_EMOTE,
): false | string;
function isEmoteModifier(
  emote: StvEmote,
  type: MessagePartType.STV_EMOTE,
): false | string;

function isEmoteModifier(
  content: string | StvEmote,
  type: MessagePartType,
): false | string {
  if (type === MessagePartType.BTTV_EMOTE) {
    return isBttvEmoteModifier(content as string);
  }

  if (type === MessagePartType.FFZ_EMOTE) {
    return isFfzEmoteModifier(content as string);
  }

  if (type === MessagePartType.STV_EMOTE) {
    return isStvEmoteModifier(content as StvEmote);
  }

  return false;
}

export default isEmoteModifier;

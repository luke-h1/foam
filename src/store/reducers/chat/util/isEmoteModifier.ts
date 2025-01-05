import { StvEmote } from '@app/services/stvService';
import { BTTV_EMOTES_MODIFIERS, FFZ_EMOTES_MODIFIERS } from '../config';
import { MessagePartType } from './messages/types/messages';

const isBttvEmoteModifier = (code: string): false | string => {
  return BTTV_EMOTES_MODIFIERS[code] || false;
};

const isFfzEmoteModifier = (id: string): false | string => {
  return FFZ_EMOTES_MODIFIERS[id] || false;
};

const isStvEmoteModifier = (emote: StvEmote): false | string => {
  return emote.flags === 1 ? '0' : false;
};

/**
 * We use the function overloading pattern here to
 * accept a range of inputs
 */

// @ts-expect-error function overload not exported
function isEmoteModifier(
  code: string,
  type: MessagePartType.BTTV_EMOTE | MessagePartType.FFZ_EMOTE,
): false | string;

// @ts-expect-error function overload not exported
function isEmoteModifier(
  emote: StvEmote,
  type: MessagePartType.STV_EMOTE,
): false | string;

export default function isEmoteModifier(
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

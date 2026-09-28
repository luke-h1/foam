import { resolveCheermoteTier } from '@app/utils/chat/cheermote-store/resolve-cheermote-tier';
import { type ChannelCheermotes } from '@app/utils/chat/cheermote-store/types';

import type { MessageToken } from './message-token';

const CHEER_TOKEN_REGEX = /^([A-Za-z]+)(\d+)$/;

function resolveCheermotePart(
  token: string,
  cheermotes: ChannelCheermotes,
): MessageToken<'cheermote'> | null {
  const match = token.match(CHEER_TOKEN_REGEX);

  if (!match) {
    return null;
  }

  const [, prefix, amount] = match;
  const tiers = cheermotes.get(prefix!.toLowerCase());

  if (!tiers) {
    return null;
  }

  const bits = Number.parseInt(amount!, 10);

  if (!Number.isFinite(bits) || bits <= 0) {
    return null;
  }

  const tier = resolveCheermoteTier(tiers, bits);

  if (!tier) {
    return null;
  }

  return {
    type: 'cheermote',
    content: token,
    cheermote: {
      bits,
      color: tier.color,
      prefix: prefix!,
      static_url: tier.staticUrl,
      url: tier.url,
    },
  };
}

/**
 * Only called for messages carrying a bits tag, so ordinary words that merely
 * look like cheers ("word1") never reach this path.
 */
export function applyCheermotesToParts(
  tokens: MessageToken[],
  cheermotes: ChannelCheermotes,
): MessageToken[] {
  let changed = false;
  const result: MessageToken[] = [];

  for (const token of tokens) {
    if (token.type !== 'text' || !token.content) {
      result.push(token);
      continue;
    }

    const segments = token.content.split(/(\s+)/);
    let pendingText = '';

    for (const segment of segments) {
      if (!segment) {
        continue;
      }

      const cheermotePart = /^\s+$/.test(segment)
        ? null
        : resolveCheermotePart(segment, cheermotes);

      if (cheermotePart && pendingText) {
        result.push({ type: 'text', content: pendingText });
        pendingText = '';
      }

      if (cheermotePart) {
        result.push(cheermotePart);
        changed = true;
      } else {
        pendingText += segment;
      }
    }

    if (pendingText) {
      result.push({ type: 'text', content: pendingText });
    }
  }

  return changed ? result : tokens;
}

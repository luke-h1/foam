import { type ChannelCheermotes, resolveCheermoteTier } from './cheermoteStore';
import type { ParsedPart } from './parsedPart';

const CHEER_TOKEN_REGEX = /^([A-Za-z]+)(\d+)$/;

function resolveCheermotePart(
  token: string,
  cheermotes: ChannelCheermotes,
): ParsedPart<'cheermote'> | null {
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
 * Splits cheer tokens (e.g. "Cheer100") out of the text parts of an already
 * parsed message. Only called for messages carrying a bits tag, so ordinary
 * words that merely look like cheers ("word1") never reach this path.
 * Returns the input array untouched when no token matches.
 */
export function applyCheermotesToParts(
  parts: ParsedPart[],
  cheermotes: ChannelCheermotes,
): ParsedPart[] {
  let changed = false;
  const result: ParsedPart[] = [];

  for (const part of parts) {
    if (part.type !== 'text' || !part.content) {
      result.push(part);
      continue;
    }

    const segments = part.content.split(/(\s+)/);
    let pendingText = '';

    for (const segment of segments) {
      if (!segment) {
        continue;
      }

      const cheermotePart = /^\s+$/.test(segment)
        ? null
        : resolveCheermotePart(segment, cheermotes);

      if (cheermotePart) {
        if (pendingText) {
          result.push({ type: 'text', content: pendingText });
          pendingText = '';
        }
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

  return changed ? result : parts;
}

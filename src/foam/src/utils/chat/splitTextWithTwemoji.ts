import twemoji from 'twemoji';

export type TwemojiResult = { text?: string; emoji?: string; image?: string }[];

/**
 * Twemoji icon names omit U+FE0F variation selectors, so the emoji rebuilt
 * from the icon can be shorter than (or absent from) the source text.
 * Scan for the emoji while tolerating interleaved/trailing U+FE0F, returning
 * the actual span consumed from `text`.
 */
function locateEmoji(
  text: string,
  emoji: string,
  fromIndex: number,
): { offset: number; length: number } | null {
  const directOffset = text.indexOf(emoji, fromIndex);

  for (let i = fromIndex; i < text.length; i += 1) {
    if (directOffset !== -1 && i > directOffset) break;
    let cursor = i;
    let matched = true;
    for (const codePoint of emoji) {
      if (cursor > i && text[cursor] === '\uFE0F') {
        cursor += 1;
      }
      if (text.startsWith(codePoint, cursor)) {
        cursor += codePoint.length;
      } else {
        matched = false;
        break;
      }
    }
    if (matched) {
      if (text[cursor] === '\uFE0F') {
        cursor += 1;
      }
      return { offset: i, length: cursor - i };
    }
  }

  return null;
}

export function splitTextWithTwemoji(text: string): TwemojiResult {
  const result: TwemojiResult = [];
  let lastIndex = 0;

  twemoji.parse(text, {
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    folder: 'svg',
    ext: '.svg',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (icon, options, _variant) => {
      const emoji = String.fromCodePoint(
        ...icon.split('-').map(hex => parseInt(hex, 16)),
      );
      const located = locateEmoji(text, emoji, lastIndex);

      // Not present in the source text (icon/text mismatch) — leave the
      // original characters in the surrounding text segment untouched.
      if (!located) {
        return '';
      }

      if (lastIndex < located.offset) {
        const textSegment = text.slice(lastIndex, located.offset).trim();
        if (textSegment) {
          result.push({ text: textSegment });
        }
      }

      // twemoji exposes the `folder` parse option as `size` in the callback
      const { base, size, ext } = options as {
        base: string;
        size: string;
        ext: string;
      };
      result.push({
        emoji: text.slice(located.offset, located.offset + located.length),
        image: `${base}${size}/${icon}${ext}`,
      });

      lastIndex = located.offset + located.length;

      return '';
    },
  });

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      result.push({ text: remainingText });
    }
  }

  return result;
}

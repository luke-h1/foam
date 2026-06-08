import twemoji from 'twemoji';

export type TwemojiResult = { text?: string; emoji?: string; image?: string }[];

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
        ...icon.split('-').map(hex => Number.parseInt(hex, 16)),
      );
      const offset = text.indexOf(emoji, lastIndex);

      if (lastIndex < offset) {
        const textSegment = text.slice(lastIndex, offset).trim();
        if (textSegment) {
          result.push({ text: textSegment });
        }
      }

      result.push({
        emoji,
        image: `${(options as { base: string }).base}${(options as { folder: string }).folder}/${icon}${(options as { ext: string }).ext}`,
      });

      lastIndex = offset + emoji.length;

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

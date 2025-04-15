export function splitTextWithTwemoji(text: string) {
  const twemojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu; // Regex to match emojis
  const result = [];
  let lastIndex = 0;

  // Use the regex to find emojis in the text
  text.replace(twemojiRegex, (match, emoji, offset) => {
    // Add text before the emoji, if any
    if (lastIndex < offset) {
      const textSegment = text.slice(lastIndex, offset).trim();
      if (textSegment) {
        result.push({ text: textSegment });
      }
    }

    // Add the emoji
    result.push({
      emoji,
      image: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${emoji
        .codePointAt(0)
        .toString(16)}.svg`,
    });

    lastIndex = offset + emoji.length;
  });

  // Add any remaining text after the last emoji
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      result.push({ text: remainingText });
    }
  }

  return result;
}

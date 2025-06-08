export const sanitizeInput = (input: string): string => {
  // First, replace special Twitch emotes with placeholders
  const heartEmotes = input.match(/<3/g) || [];
  const angryEmotes = input.match(/>\(/g) || [];
  const heartPlaceholder = '___TWITCH_HEART___';
  const angryPlaceholder = '___TWITCH_ANGRY___';

  // Replace emotes with placeholders
  let sanitized = input
    .replace(/<3/g, heartPlaceholder)
    .replace(/>\(/g, angryPlaceholder);

  // Sanitize other HTML tags
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Restore Twitch global emotes
  heartEmotes.forEach(() => {
    sanitized = sanitized.replace(heartPlaceholder, '<3');
  });
  angryEmotes.forEach(() => {
    sanitized = sanitized.replace(angryPlaceholder, '>(');
  });

  return sanitized;
};

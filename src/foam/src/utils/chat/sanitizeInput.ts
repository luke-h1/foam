export const sanitizeInput = (input: string): string => {
  const heartEmotes = input.match(/<3/g) || [];
  const angryEmotes = input.match(/>\(/g) || [];
  const heartPlaceholder = '___TWITCH_HEART___';
  const angryPlaceholder = '___TWITCH_ANGRY___';

  let sanitized = input
    .replace(/<3/g, heartPlaceholder)
    .replace(/>\(/g, angryPlaceholder);

  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  heartEmotes.forEach(() => {
    sanitized = sanitized.replace(heartPlaceholder, '<3');
  });
  angryEmotes.forEach(() => {
    sanitized = sanitized.replace(angryPlaceholder, '>(');
  });

  return sanitized;
};

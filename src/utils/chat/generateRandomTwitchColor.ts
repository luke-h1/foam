const twitchColors = [
  '#0000FF',
  '#8A2BE2',
  '#5F9EA0',
  '#D2691E',
  '#FF7F50',
  '#1E90FF',
  '#B22222',
  '#DAA520',
  '#008000',
  '#FF69B4',
  '#FF4500',
  '#FF0000',
  '#2E8B57',
  '#00FF7F',
  '#9ACD32',
] as const;

export function generateRandomTwitchColor(username?: string): string {
  if (!username) {
    const randomIndex = Math.floor(Math.random() * twitchColors.length);
    return twitchColors[randomIndex] ?? twitchColors[0];
  }

  let hash = 0;

  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + hash * 31;
  }

  hash = Math.abs(hash);

  const colorIndex = hash % twitchColors.length;

  return twitchColors[colorIndex] ?? twitchColors[0];
}

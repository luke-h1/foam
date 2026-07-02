const twitchColors = [
  '#0000FF', // Blue
  '#8A2BE2', // Blue Violet
  '#5F9EA0', // Cadet Blue
  '#D2691E', // Chocolate
  '#FF7F50', // Coral
  '#1E90FF', // Dodger Blue
  '#B22222', // Firebrick
  '#DAA520', // Golden Rod
  '#008000', // Green
  '#FF69B4', // Hot Pink
  '#FF4500', // Orange Red
  '#FF0000', // Red
  '#2E8B57', // Sea Green
  '#00FF7F', // Spring Green
  '#9ACD32', // Yellow Green
] as const;

export function generateRandomTwitchColor(username?: string): string {
  if (!username) {
    const randomIndex = Math.floor(Math.random() * twitchColors.length);
    return twitchColors[randomIndex] as string;
  }

  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + hash * 31;
  }

  hash = Math.abs(hash);

  const colorIndex = hash % twitchColors.length;

  return twitchColors[colorIndex] as string;
}

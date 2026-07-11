import { generateRandomTwitchColor } from '../generateRandomTwitchColor';

// The full palette is the contract callers rely on; the module keeps it private
// so it is pinned here to guard against a colour being added, removed, or moved.
const TWITCH_COLORS = [
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
];

describe('generateRandomTwitchColor', () => {
  test.each([
    ['aleksim64', '#008000'],
    ['TestUser', '#B22222'],
    ['ninja', '#D2691E'],
    ['MentionOnly', '#FF4500'],
    ['用户名', '#5F9EA0'],
  ])('maps %s to its deterministic palette colour', (username, expected) => {
    expect(generateRandomTwitchColor(username)).toBe(expected);
  });

  test('returns the same colour for the same username on repeated calls', () => {
    expect(generateRandomTwitchColor('aleksim64')).toBe(
      generateRandomTwitchColor('aleksim64'),
    );
  });

  test('is case sensitive, so different casings can hash to different colours', () => {
    expect(generateRandomTwitchColor('TestUser')).not.toBe(
      generateRandomTwitchColor('testuser'),
    );
  });

  test('falls back to a palette colour when no username is given', () => {
    expect(TWITCH_COLORS).toContain(generateRandomTwitchColor());
  });

  test('falls back to a palette colour for an empty username', () => {
    expect(TWITCH_COLORS).toContain(generateRandomTwitchColor(''));
  });
});

import { generateRandomTwitchColor } from '../generateRandomTwitchColor';

describe('generateRandomTwitchColor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    ['aleksim64', '#008000'],
    ['TestUser', '#B22222'],
    ['ninja', '#D2691E'],
    ['MentionOnly', '#FF4500'],
    ['用户名', '#5F9EA0'],
  ])('maps %s to its deterministic palette colour', (username, expected) => {
    expect(generateRandomTwitchColor(username)).toBe(expected);
  });

  test('is case sensitive, so different casings can hash to different colours', () => {
    expect(generateRandomTwitchColor('TestUser')).not.toBe(
      generateRandomTwitchColor('testuser'),
    );
  });

  test.each<[string, string | undefined, number, string]>([
    ['no username', undefined, 0, '#0000FF'],
    ['an empty username', '', 0.99, '#9ACD32'],
  ])(
    'picks a random palette colour for %s',
    (_label, username, random, expected) => {
      jest.spyOn(Math, 'random').mockReturnValue(random);

      expect(generateRandomTwitchColor(username)).toBe(expected);
    },
  );
});

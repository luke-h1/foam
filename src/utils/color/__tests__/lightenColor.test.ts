import { lightenColor } from '../lightenColor';

/**
 * Expected values are pinned literals: deriving them from the implementation's
 * own luminance maths would pass even if that maths were wrong.
 */
describe('lightenColor', () => {
  test.each([
    ['twitch blue', '#0000FF', 'rgb(94, 94, 255)'],
    ['pure black', '#000000', 'rgb(117, 117, 117)'],
  ])(
    'lifts %s until it is readable on the black chat canvas',
    (_label, hex, expected) => {
      expect(lightenColor(hex)).toBe(expected);
    },
  );

  test.each([
    ['white', '#FFFFFF', 'rgb(255, 255, 255)'],
    [
      'twitch red, which already passes 4.5:1 on black',
      '#FF0000',
      'rgb(255, 0, 0)',
    ],
    ['already-readable teal', '#1ac9a2', 'rgb(26, 201, 162)'],
    ['perceptually bright green', '#009800', 'rgb(0, 152, 0)'],
  ])('leaves %s untouched', (_label, hex, expected) => {
    expect(lightenColor(hex)).toBe(expected);
  });

  test('returns the input unchanged when it is not a colour', () => {
    expect(lightenColor('not-a-color')).toBe('not-a-color');
  });
});

import { lightenColor } from '../lightenColor';

/**
 * Expected values are pinned literals: deriving them from the implementation's
 * own luminance maths would pass even if that maths were wrong.
 */
describe('lightenColor', () => {
  test.each([
    ['twitch blue', '#0000FF', 'rgb(112, 112, 255)'],
    ['twitch red', '#FF0000', 'rgb(255, 30, 30)'],
    ['pure black', '#000000', 'rgb(130, 130, 130)'],
  ])('lifts %s until it is readable on chat', (_label, hex, expected) => {
    expect(lightenColor(hex)).toBe(expected);
  });

  test.each([
    ['white', '#FFFFFF', 'rgb(255, 255, 255)'],
    ['already-readable teal', '#1ac9a2', 'rgb(26, 201, 162)'],
    ['perceptually bright green', '#009800', 'rgb(0, 152, 0)'],
  ])('leaves %s untouched', (_label, hex, expected) => {
    expect(lightenColor(hex)).toBe(expected);
  });

  test('keeps the hue when lifting, rather than washing to white', () => {
    const lifted = lightenColor('#0000FF');
    const [, r, g, b] = /rgb\((\d+), (\d+), (\d+)\)/.exec(lifted)!.map(Number);

    expect(b).toBeGreaterThan(r!);
    expect(b).toBeGreaterThan(g!);
    expect(Math.min(r!, g!)).toBeLessThan(255);
  });

  test('returns the input unchanged when it is not a colour', () => {
    expect(lightenColor('not-a-color')).toBe('not-a-color');
  });
});

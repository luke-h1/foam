import { lightenColor } from '../lightenColor';

const CHAT_SURFACE = { r: 20, g: 27, b: 35 };

function parseRgb(value: string): { r: number; g: number; b: number } {
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(value);
  if (!match) {
    throw new Error(`expected an rgb() string, got ${value}`);
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

function relativeLuminance({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastAgainstChat(value: string): number {
  const foreground = relativeLuminance(parseRgb(value));
  const background = relativeLuminance(CHAT_SURFACE);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('lightenColor', () => {
  test.each([
    ['twitch blue', '#0000FF'],
    ['twitch red', '#FF0000'],
    ['twitch dark blue', '#0000BF'],
    ['chocolate', '#D2691E'],
    ['sea green', '#2E8B57'],
    ['black', '#000000'],
  ])('lifts %s to a readable contrast on the chat surface', (_label, hex) => {
    expect(contrastAgainstChat(lightenColor(hex))).toBeGreaterThanOrEqual(4.5);
  });

  test('leaves an already-readable colour untouched', () => {
    expect(lightenColor('#FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  test('keeps the hue when lifting a dark colour', () => {
    const { r, g, b } = parseRgb(lightenColor('#0000FF'));

    // Still recognisably blue rather than flattened towards white.
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  test('does not overshoot to white when a small lift is enough', () => {
    const { r, g } = parseRgb(lightenColor('#0000FF'));

    expect(Math.min(r, g)).toBeLessThan(255);
  });

  test('returns the input unchanged when it is not a colour', () => {
    expect(lightenColor('not-a-color')).toBe('not-a-color');
  });
});

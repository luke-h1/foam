import { ChannelAccent, deriveChannelAccent } from '../deriveChannelAccent';
import {
  pokimaneDarkAccent,
  xqcDarkAccent,
  xqcLightAccent,
} from './__fixtures__/deriveChannelAccent.fixture';

const HEX = /^#[0-9a-fA-F]{6}$/;

describe('deriveChannelAccent', () => {
  test('produces the pinned palette for a known seed and scheme', () => {
    expect(deriveChannelAccent('xqc', 'dark')).toEqual<ChannelAccent>(
      xqcDarkAccent,
    );
    expect(deriveChannelAccent('xqc', 'light')).toEqual<ChannelAccent>(
      xqcLightAccent,
    );
    expect(deriveChannelAccent('pokimane', 'dark')).toEqual<ChannelAccent>(
      pokimaneDarkAccent,
    );
  });

  test('is deterministic across calls', () => {
    expect(deriveChannelAccent('pokimane', 'dark')).toEqual(
      deriveChannelAccent('pokimane', 'dark'),
    );
  });

  test('normalises the seed so casing and surrounding space do not matter', () => {
    const canonical = deriveChannelAccent('xqc', 'dark');
    expect(deriveChannelAccent('  XQC  ', 'dark')).toEqual(canonical);
  });

  test('gives different seeds different palettes', () => {
    expect(deriveChannelAccent('xqc', 'dark').base).not.toBe(
      deriveChannelAccent('pokimane', 'dark').base,
    );
  });

  test('tunes the same seed differently per scheme', () => {
    expect(deriveChannelAccent('xqc', 'dark').base).not.toBe(
      deriveChannelAccent('xqc', 'light').base,
    );
  });

  test('emits valid six-digit hex for every colour field', () => {
    const accent = deriveChannelAccent('forsen', 'dark');
    expect(accent.colors[0]).toMatch(HEX);
    expect(accent.colors[1]).toMatch(HEX);
    expect(accent.colors[2]).toMatch(HEX);
    expect(accent.glow).toMatch(HEX);
    expect(accent.base).toMatch(HEX);
  });
});

import { resolveThemeColor } from '../themes';

describe('resolveThemeColor', () => {
  test('uses accent color for accent-only groups by default', () => {
    expect(resolveThemeColor('accent')).toBe('#2E86FF');

    expect(resolveThemeColor('red')).toBe('#f87171');
  });

  test('uses high-contrast text for gray by default', () => {
    expect(resolveThemeColor('gray')).toBe('#F5F5F7');
  });

  test('resolves explicit nested tokens', () => {
    expect(resolveThemeColor('gray.textLow')).toBe('#98989F');

    expect(resolveThemeColor('accent.accentHover')).toBe('#5AA1FF');
  });

  test('prefers contrast token when requested', () => {
    expect(resolveThemeColor('accent', { contrast: true })).toBe('#FFFFFF');
  });
});

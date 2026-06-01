import { resolveThemeColor, semanticColorGroups } from '../themes';

describe('resolveThemeColor', () => {
  test('uses accent color for accent-only groups by default', () => {
    expect(resolveThemeColor('accent')).toBe(semanticColorGroups.accent.accent);
    expect(resolveThemeColor('red')).toBe(semanticColorGroups.red.accent);
  });

  test('uses high-contrast text for gray by default', () => {
    expect(resolveThemeColor('gray')).toBe(semanticColorGroups.gray.text);
  });

  test('resolves explicit nested tokens', () => {
    expect(resolveThemeColor('gray.textLow')).toBe(
      semanticColorGroups.gray.textLow,
    );
    expect(resolveThemeColor('accent.accentHover')).toBe(
      semanticColorGroups.accent.accentHover,
    );
  });

  test('prefers contrast token when requested', () => {
    expect(resolveThemeColor('accent', { contrast: true })).toBe(
      semanticColorGroups.accent.contrast,
    );
  });
});

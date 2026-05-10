import { resolveThemeColor, semanticColorGroups } from '../themes';

describe('resolveThemeColor', () => {
  it('uses accent color for accent-only groups by default', () => {
    expect(resolveThemeColor('accent')).toBe(semanticColorGroups.accent.accent);
    expect(resolveThemeColor('red')).toBe(semanticColorGroups.red.accent);
  });

  it('uses high-contrast text for gray by default', () => {
    expect(resolveThemeColor('gray')).toBe(semanticColorGroups.gray.text);
  });

  it('resolves explicit nested tokens', () => {
    expect(resolveThemeColor('gray.textLow')).toBe(
      semanticColorGroups.gray.textLow,
    );
    expect(resolveThemeColor('accent.accentHover')).toBe(
      semanticColorGroups.accent.accentHover,
    );
  });

  it('prefers contrast token when requested', () => {
    expect(resolveThemeColor('accent', { contrast: true })).toBe(
      semanticColorGroups.accent.contrast,
    );
  });
});

import { resolveThemeColor, semanticColorGroups } from '../themes';

describe('resolveThemeColor', () => {
  test('uses accent color for accent-only groups by default', () => {
    expect(resolveThemeColor('accent', 'dark')).toBe(
      semanticColorGroups.dark.accent.accent,
    );
    expect(resolveThemeColor('red', 'dark')).toBe(
      semanticColorGroups.dark.red.accent,
    );
    expect(resolveThemeColor('accent', 'light')).toBe(
      semanticColorGroups.light.accent.accent,
    );
    expect(resolveThemeColor('red', 'light')).toBe(
      semanticColorGroups.light.red.accent,
    );
  });

  test('uses high-contrast text for gray by default', () => {
    expect(resolveThemeColor('gray', 'dark')).toBe(
      semanticColorGroups.dark.gray.text,
    );
    expect(resolveThemeColor('gray', 'light')).toBe(
      semanticColorGroups.light.gray.text,
    );
  });

  test('resolves explicit nested tokens', () => {
    expect(resolveThemeColor('gray.textLow', 'dark')).toBe(
      semanticColorGroups.dark.gray.textLow,
    );
    expect(resolveThemeColor('accent.accentHover', 'dark')).toBe(
      semanticColorGroups.dark.accent.accentHover,
    );
    expect(resolveThemeColor('gray.textLow', 'light')).toBe(
      semanticColorGroups.light.gray.textLow,
    );
  });

  test('prefers contrast token when requested', () => {
    expect(resolveThemeColor('accent', 'dark', { contrast: true })).toBe(
      semanticColorGroups.dark.accent.contrast,
    );
    expect(resolveThemeColor('accent', 'light', { contrast: true })).toBe(
      semanticColorGroups.light.accent.contrast,
    );
  });

  test('light and dark groups expose the same token shape', () => {
    for (const group of Object.keys(
      semanticColorGroups.dark,
    ) as (keyof typeof semanticColorGroups.dark)[]) {
      expect(Object.keys(semanticColorGroups.light[group]).sort()).toEqual(
        Object.keys(semanticColorGroups.dark[group]).sort(),
      );
    }
  });
});

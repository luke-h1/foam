import type { MaterialColors, RgbaHex } from '@expo/ui/jetpack-compose';

import { theme } from '@app/styles/themes';

function role(color: string): RgbaHex {
  const hex = color.length === 7 ? `${color}FF` : color;

  // SAFETY: callers pass theme hex tokens, which are #RRGGBB or #RRGGBBAA.
  return hex.toUpperCase() as RgbaHex;
}

const accent = role(theme.colorPrimary);
const onAccent = role(theme.color.onAccent.dark);
const accentPress = role(theme.color.accentPress.dark);
const accentSurface = role(theme.colorAccentSurface);
const canvas = role(theme.color.background.dark);
const surface = role(theme.color.surfaceNeutral.dark);
const surfaceRaised = role(theme.color.surfaceElevated.dark);
const surfaceSunken = role(theme.color.menu.background);
const text = role(theme.color.text.dark);
const textSecondary = role(theme.color.textSecondary.dark);
const outline = role(theme.colorBorderSecondary);
const error = role(theme.colorRed);
const errorSurface = role(theme.colorRedSurface);

/**
 * Material 3 roles for every Compose host.
 *
 * `colorScheme="dark"` still follows the wallpaper on Android 12+. These
 * roles keep the accent, surfaces and errors on the foam-dark palette.
 */
export const foamMaterialColorOverrides = {
  primary: accent,
  onPrimary: onAccent,
  primaryContainer: accentSurface,
  onPrimaryContainer: text,
  inversePrimary: accentPress,
  secondary: accent,
  onSecondary: onAccent,
  secondaryContainer: accentSurface,
  onSecondaryContainer: text,
  tertiary: accent,
  onTertiary: onAccent,
  tertiaryContainer: accentSurface,
  onTertiaryContainer: text,
  background: canvas,
  onBackground: text,
  surface,
  onSurface: text,
  surfaceVariant: surfaceRaised,
  onSurfaceVariant: textSecondary,
  surfaceTint: surface,
  inverseSurface: text,
  inverseOnSurface: canvas,
  error,
  onError: onAccent,
  errorContainer: errorSurface,
  onErrorContainer: text,
  outline,
  outlineVariant: outline,
  scrim: role('#0000009E'),
  surfaceBright: surfaceRaised,
  surfaceDim: canvas,
  surfaceContainer: surface,
  surfaceContainerHigh: surfaceRaised,
  surfaceContainerHighest: surfaceRaised,
  surfaceContainerLow: surfaceSunken,
  surfaceContainerLowest: canvas,
  primaryFixed: accent,
  primaryFixedDim: accentPress,
  onPrimaryFixed: canvas,
  onPrimaryFixedVariant: text,
  secondaryFixed: accent,
  secondaryFixedDim: accentPress,
  onSecondaryFixed: canvas,
  onSecondaryFixedVariant: text,
  tertiaryFixed: accent,
  tertiaryFixedDim: accentPress,
  onTertiaryFixed: canvas,
  onTertiaryFixedVariant: text,
} satisfies Partial<MaterialColors>;

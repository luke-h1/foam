// Shape names here are @expo/ui SwiftUI/Compose API names, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import {
  accessibilityLabel,
  background,
  buttonStyle,
  clipShape,
  disabled as disabledModifier,
  frame,
  padding,
  tint,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { theme } from '@app/styles/themes';

interface ComposerButtonAppearanceOptions {
  disabled?: boolean;
  label?: string;
  prominent?: boolean;
  prominentColor: string;
  quiet?: boolean;
  size: number;
}

export function composerButtonAppearance({
  disabled,
  label,
  prominent,
  prominentColor,
  quiet,
  size,
}: ComposerButtonAppearanceOptions) {
  const liquidGlassAvailable = isLiquidGlassAvailable();

  let resolvedButtonStyle: 'glassProminent' | 'glass' | 'bordered' | 'plain';

  if (quiet) {
    resolvedButtonStyle = 'plain';
  } else if (liquidGlassAvailable) {
    resolvedButtonStyle = prominent && !disabled ? 'glassProminent' : 'glass';
  } else {
    resolvedButtonStyle = prominent && !disabled ? 'bordered' : 'plain';
  }

  let iconColor: string;

  if (disabled) {
    iconColor = 'rgba(255,255,255,0.36)';
  } else if (prominent) {
    iconColor = theme.colorWhite;
  } else if (quiet) {
    iconColor = 'rgba(255,255,255,0.45)';
  } else {
    iconColor = 'rgba(255,255,255,0.86)';
  }

  let resolvedBackground: string;

  if (quiet) {
    resolvedBackground = 'transparent';
  } else if (prominent && !disabled) {
    resolvedBackground = liquidGlassAvailable ? 'transparent' : prominentColor;
  } else if (liquidGlassAvailable) {
    resolvedBackground = 'transparent';
  } else {
    resolvedBackground = 'rgba(255,255,255,0.12)';
  }

  const buttonModifiers: ViewModifier[] = [
    tint(prominent && !disabled ? prominentColor : iconColor),
    buttonStyle(resolvedButtonStyle),

    frame({ width: size, height: size }),
    background(resolvedBackground),
    clipShape('circle'),
    disabledModifier(Boolean(disabled)),
  ];

  if (label) {
    buttonModifiers.push(accessibilityLabel(label));
  }

  const iconInset = liquidGlassAvailable || quiet;

  const iconModifiers: ViewModifier[] = [
    padding({ vertical: 6, horizontal: 0 }),
    clipShape('circle'),
    padding({
      horizontal: iconInset ? 0 : 12,
      vertical: iconInset ? 0 : 8,
    }),
  ];

  return { buttonModifiers, iconColor, iconModifiers };
}

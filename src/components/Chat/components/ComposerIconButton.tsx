// Shape names here are @expo/ui SwiftUI/Compose API names, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { StyleSheet } from 'react-native';

import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
} from '@expo/ui/swift-ui';
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
import type { SFSymbol } from 'sf-symbols-typescript';

import { theme } from '@app/styles/themes';

import { COMPOSER_CONTROL_SIZE } from '../util/composerSizing';

interface ComposerButtonAppearanceOptions {
  active?: boolean;
  disabled?: boolean;
  label?: string;
  prominent?: boolean;
  prominentColor: string;
  /**
   * Drops the backing circle for a glyph that sits inside the input pill.
   */
  quiet?: boolean;
  size: number;
}

export function composerButtonAppearance({
  active,
  disabled,
  label,
  prominent,
  prominentColor,
  quiet,
  size,
}: ComposerButtonAppearanceOptions) {
  const liquidGlassAvailable = isLiquidGlassAvailable();
  const isHighlighted = Boolean(active || prominent);

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
  } else if (isHighlighted) {
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
    /**
     * `glassProminent` fills from the tint. A background of the same colour
     * under it leaves a lighter rim.
     */
    resolvedBackground = liquidGlassAvailable ? 'transparent' : prominentColor;
  } else if (liquidGlassAvailable) {
    resolvedBackground = 'transparent';
  } else if (active) {
    resolvedBackground = 'rgba(255,255,255,0.18)';
  } else {
    resolvedBackground = 'rgba(255,255,255,0.12)';
  }

  const buttonModifiers: ViewModifier[] = [
    tint(prominent && !disabled ? prominentColor : iconColor),
    buttonStyle(resolvedButtonStyle),

    /**
     * Pin to the host's exact size - a content-sized button drifts out of
     * line with its RN row siblings.
     */
    frame({ width: size, height: size }),
    background(resolvedBackground),
    clipShape('circle'),
    disabledModifier(Boolean(disabled)),
  ];

  if (label) {
    buttonModifiers.push(accessibilityLabel(label));
  }

  return { buttonModifiers, iconColor, liquidGlassAvailable };
}

export interface ComposerIconButtonProps {
  active?: boolean;
  disabled?: boolean;
  icon: SFSymbol;
  iconSize?: number;
  label?: string;
  onPress: () => void;
  prominent?: boolean;
  /**
   * Surface color for the prominent variant; defaults to the app violet.
   */
  prominentColor?: string;
  quiet?: boolean;
  size?: number;
}

export function ComposerIconButton({
  active,
  disabled,
  icon,
  iconSize = 18,
  label,
  onPress,
  prominent,
  prominentColor = theme.colorViolet,
  quiet,
  size = COMPOSER_CONTROL_SIZE,
}: ComposerIconButtonProps) {
  const { buttonModifiers, iconColor, liquidGlassAvailable } =
    composerButtonAppearance({
      active,
      disabled,
      label,
      prominent,
      prominentColor,
      quiet,
      size,
    });

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    /**
     * No matchContents - SwiftUI must not re-measure; ignoreSafeArea stops the
     * home-indicator inset shifting the button out of the host frame.
     */
    <Host
      ignoreSafeArea='all'
      style={[styles.host, { width: size, height: size }]}
    >
      <GlassEffectContainer>
        <SwiftUIButton onPress={handlePress} modifiers={buttonModifiers}>
          <Image
            color={iconColor}
            modifiers={[
              padding({ vertical: 6, horizontal: 0 }),
              clipShape('circle'),
              padding({
                horizontal: liquidGlassAvailable || quiet ? 0 : 12,
                vertical: liquidGlassAvailable || quiet ? 0 : 8,
              }),
            ]}
            size={iconSize}
            systemName={icon}
          />
        </SwiftUIButton>
      </GlassEffectContainer>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flexShrink: 0,
  },
});

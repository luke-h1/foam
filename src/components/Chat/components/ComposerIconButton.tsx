import { StyleSheet, useColorScheme } from 'react-native';

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

import { COMPOSER_CONTROL_SIZE } from './composerSizing';

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
   *
   */
  prominentColor?: string;
}

export function ComposerIconButton({
  active,
  disabled,
  icon,
  iconSize = 18,
  label,
  onPress,
  prominent,
  prominentColor,
}: ComposerIconButtonProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const resolvedProminentColor = prominentColor ?? theme.color.violet[scheme];
  const liquidGlassAvailable = isLiquidGlassAvailable();
  const isHighlighted = Boolean(active || prominent);

  let resolvedButtonStyle: 'glassProminent' | 'glass' | 'bordered' | 'plain';

  if (liquidGlassAvailable) {
    resolvedButtonStyle = prominent ? 'glassProminent' : 'glass';
  } else {
    resolvedButtonStyle = prominent ? 'bordered' : 'plain';
  }

  const isDark = scheme === 'dark';
  let iconColor: string;

  if (disabled) {
    iconColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(0,0,0,0.30)';
  } else if (prominent) {
    iconColor = theme.colorWhite;
  } else if (isHighlighted) {
    iconColor = theme.color.text[scheme];
  } else {
    iconColor = isDark ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.72)';
  }

  let resolvedBackground: string;

  if (prominent && !disabled) {
    resolvedBackground = resolvedProminentColor;
  } else if (liquidGlassAvailable) {
    resolvedBackground = 'transparent';
  } else if (active) {
    resolvedBackground = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  } else {
    resolvedBackground = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  }

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };
  const buttonModifiers: ViewModifier[] = [
    tint(prominent && !disabled ? resolvedProminentColor : iconColor),
    buttonStyle(resolvedButtonStyle),

    /**
     * Pin the button to the host's exact size. Button styles (glass, glassProminent, bordered) measure differently per style and OS, and a content-sized button drifts out of line with its RN row siblings.
     */
    frame({ width: COMPOSER_CONTROL_SIZE, height: COMPOSER_CONTROL_SIZE }),
    background(resolvedBackground),
    clipShape('circle'),
    disabledModifier(Boolean(disabled)),
  ];

  if (label) {
    buttonModifiers.push(accessibilityLabel(label));
  }

  return (
    /**
     * no matchContents - SwiftUI must not re-measure it) and ignoreSafeArea
     * stops the hosting view re-applying the home-indicator inset inside its
     * own bounds, which renders the button shifted out of the host frame.
     */
    <Host ignoreSafeArea='all' style={styles.host}>
      <GlassEffectContainer>
        <SwiftUIButton onPress={handlePress} modifiers={buttonModifiers}>
          <Image
            color={iconColor}
            modifiers={[
              padding({ vertical: 6, horizontal: 0 }),
              clipShape('circle'),
              padding({
                horizontal: liquidGlassAvailable ? 0 : 12,
                vertical: liquidGlassAvailable ? 0 : 8,
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
    height: COMPOSER_CONTROL_SIZE,
    width: COMPOSER_CONTROL_SIZE,
  },
});

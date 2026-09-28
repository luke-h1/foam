// Shape names here are @expo/ui SwiftUI/Compose API names, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { StyleSheet } from 'react-native';

import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
} from '@expo/ui/swift-ui';
import { clipShape, padding } from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import { theme } from '@app/styles/themes';

import { COMPOSER_CONTROL_SIZE } from '../util/composer-sizing';
import { composerButtonAppearance } from './util/composer-button-appearance';

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

import { StyleSheet } from 'react-native';

import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
} from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';

import { theme } from '@app/styles/themes';

import { composerButtonAppearance } from '../util/composerButtonAppearance';
import { COMPOSER_CONTROL_SIZE } from '../util/composerSizing';

interface ComposerIconButtonProps {
  disabled?: boolean;
  icon: SFSymbol;
  iconSize?: number;
  label?: string;
  onPress: () => void;
  prominent?: boolean;
  prominentColor?: string;
  quiet?: boolean;
  size?: number;
}

export function ComposerIconButton({
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
  const { buttonModifiers, iconColor, iconModifiers } =
    composerButtonAppearance({
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
            modifiers={iconModifiers}
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

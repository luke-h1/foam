import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { theme } from '@app/styles/themes';
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
  padding,
  tint,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import { SFSymbol } from 'expo-symbols';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { COMPOSER_CONTROL_SIZE } from '../constants/composerSizing';

type SwiftUIButtonStyle = Parameters<typeof buttonStyle>[0];

interface ActionIconButtonProps {
  active?: boolean;
  disabled?: boolean;
  icon: SFSymbol;
  label?: string;
  onPress: () => void;
  prominent?: boolean;
}

function ActionIconButtonComponent({
  active,
  disabled,
  icon,
  label,
  onPress,
  prominent,
}: ActionIconButtonProps) {
  const liquidGlassAvailable = isLiquidGlassAvailable();
  const isHighlighted = Boolean(active || prominent);
  let resolvedButtonStyle: SwiftUIButtonStyle = 'plain';

  if (liquidGlassAvailable) {
    resolvedButtonStyle = prominent ? 'glassProminent' : 'glass';
  } else if (prominent) {
    resolvedButtonStyle = 'bordered';
  }

  let iconColor = 'rgba(255,255,255,0.86)';

  if (disabled) {
    iconColor = 'rgba(255,255,255,0.36)';
  } else if (isHighlighted) {
    iconColor = '#ffffff';
  }

  let buttonBackground = 'rgba(255,255,255,0.12)';
  if (prominent) {
    buttonBackground = theme.colorViolet;
  } else if (liquidGlassAvailable) {
    buttonBackground = 'transparent';
  } else if (active) {
    buttonBackground = 'rgba(255,255,255,0.18)';
  }

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };
  const buttonModifiers: ViewModifier[] = [
    tint(iconColor),
    buttonStyle(resolvedButtonStyle),
    background(buttonBackground),
    clipShape('circle'),
    disabledModifier(Boolean(disabled)),
  ];

  if (label) {
    buttonModifiers.push(accessibilityLabel(label));
  }

  return (
    <Host matchContents style={styles.actionButtonHost}>
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
            size={18}
            systemName={icon}
          />
        </SwiftUIButton>
      </GlassEffectContainer>
    </Host>
  );
}

export const ActionIconButton = memo(ActionIconButtonComponent);

const styles = StyleSheet.create({
  actionButtonHost: {
    flexShrink: 0,
    height: COMPOSER_CONTROL_SIZE,
    width: COMPOSER_CONTROL_SIZE,
  },
});

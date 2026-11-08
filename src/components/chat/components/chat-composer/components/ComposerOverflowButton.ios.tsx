import { StyleSheet } from 'react-native';

import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
  Menu,
} from '@expo/ui/swift-ui';
import { disabled as disabledModifier } from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

import { composerButtonAppearance } from '../util/composerButtonAppearance';
import type { ComposerOverflowAction } from '../util/composerOverflowActions';
import { COMPOSER_CONTROL_SIZE } from '../util/composerSizing';

export interface ComposerOverflowButtonProps {
  actions: ComposerOverflowAction[];
  busy?: boolean;
}

export function ComposerOverflowButton({
  actions,
  busy,
}: ComposerOverflowButtonProps) {
  if (actions.length === 0) {
    return null;
  }

  const { buttonModifiers, iconColor, iconModifiers } =
    composerButtonAppearance({
      label: 'More options',
      prominentColor: theme.colorViolet,
      size: COMPOSER_CONTROL_SIZE,
    });

  return (
    <Host ignoreSafeArea='all' style={styles.host}>
      <GlassEffectContainer>
        <Menu
          label={
            <Image
              color={iconColor}
              modifiers={iconModifiers}
              size={20}
              systemName={busy ? 'arrow.up.circle' : 'plus'}
            />
          }
          modifiers={buttonModifiers}
        >
          {actions.map(action => (
            <SwiftUIButton
              key={action.label}
              label={action.label}
              modifiers={[disabledModifier(Boolean(action.disabled))]}
              onPress={action.onPress}
              systemImage={action.icon}
            />
          ))}
        </Menu>
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

// Shape names here are @expo/ui SwiftUI API names, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { StyleSheet } from 'react-native';

import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
  Menu,
} from '@expo/ui/swift-ui';
import {
  clipShape,
  disabled as disabledModifier,
  padding,
} from '@expo/ui/swift-ui/modifiers';

import { theme } from '@app/styles/themes';

import type { ComposerOverflowAction } from '../util/composerOverflowActions';
import { COMPOSER_CONTROL_SIZE } from '../util/composerSizing';
import { composerButtonAppearance } from './ComposerIconButton';

export interface ComposerOverflowButtonProps {
  actions: ComposerOverflowAction[];
  /**
   * Swaps the plus for a progress glyph while an attachment uploads.
   */
  busy?: boolean;
}

export function ComposerOverflowButton({
  actions,
  busy,
}: ComposerOverflowButtonProps) {
  if (actions.length === 0) {
    return null;
  }

  const { buttonModifiers, iconColor, liquidGlassAvailable } =
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
              modifiers={[
                padding({ vertical: 6, horizontal: 0 }),
                clipShape('circle'),
                padding({
                  horizontal: liquidGlassAvailable ? 0 : 12,
                  vertical: liquidGlassAvailable ? 0 : 8,
                }),
              ]}
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

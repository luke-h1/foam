import { StyleSheet } from 'react-native';

import { PressableScale } from 'pressto';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { presentActionMenu } from '@app/store/overlays/actionMenuStore';
import { theme } from '@app/styles/themes';

import type { ComposerOverflowAction } from '../util/composerOverflowActions';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
} from '../util/composerSizing';

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

  const handlePress = () => {
    presentActionMenu({
      actions: actions
        .filter(action => !action.disabled)
        .map(action => ({ label: action.label, onPress: action.onPress })),
      cancelLabel: 'Cancel',
      title: 'Message',
    });
  };

  return (
    <PressableScale
      accessibilityLabel='More options'
      accessibilityRole='button'
      onPress={handlePress}
      style={styles.trigger}
    >
      <SymbolView
        name={busy ? 'arrow.up.circle' : 'plus'}
        size={22}
        tintColor={theme.colorGreyHoverAlpha}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    flexShrink: 0,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
});

import { StyleSheet } from 'react-native';

import { IconButton } from '@app/components/icon-button/icon-button';
import type { SymbolViewProps } from '@app/components/ui/icon/icon';
import { theme } from '@app/styles/themes';

interface PlayerIconButtonProps {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  /**
   * A toggle that is on, such as a running sleep timer.
   */
  active?: boolean;
}

/**
 * Round button over video. The dark fill keeps the icon readable on bright
 * frames.
 */
export function PlayerIconButton({
  icon,
  label,
  onPress,
  active = false,
}: PlayerIconButtonProps) {
  return (
    <IconButton
      icon={{
        type: 'symbol',
        name: icon,
        size: 18,
        color: active ? theme.color.accent.dark : undefined,
      }}
      label={active ? `${label}, on` : label}
      onPress={onPress}
      size='2xl'
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.color.scrim.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    justifyContent: 'center',
  },
});

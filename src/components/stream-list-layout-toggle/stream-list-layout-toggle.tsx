import { StyleSheet } from 'react-native';

import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { selection } from '@app/lib/haptics';
import { type Preferences } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

type StreamListLayout = Preferences['streamListLayout'];

export function StreamListLayoutToggle({
  value,
  onChange,
}: {
  value: StreamListLayout;
  onChange: (value: StreamListLayout) => void;
}) {
  const isCompact = value === 'compact';

  return (
    <Button
      accessibilityRole='button'
      accessibilityLabel={
        isCompact ? 'Switch to media layout' : 'Switch to compact layout'
      }
      hitSlop={10}
      onPress={() => {
        selection();
        onChange(isCompact ? 'media' : 'compact');
      }}
      style={styles.button}
    >
      <SymbolView
        name={isCompact ? 'square.grid.2x2' : 'list.bullet'}
        size={24}
        tintColor={theme.color.text.dark}
      />
    </Button>
  );
}

/**
 * A Material top app bar action: a bare icon in a 48 dp target, so the
 * ripple is the only shape.
 */
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});

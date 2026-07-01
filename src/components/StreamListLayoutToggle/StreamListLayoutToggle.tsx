import { StyleSheet } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { selection } from '@app/lib/haptics';
import { type Preferences } from '@app/store/preferenceStore';
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
        void selection();
        onChange(isCompact ? 'media' : 'compact');
      }}
      style={styles.button}
    >
      <SymbolView
        name={isCompact ? 'square.grid.2x2' : 'list.bullet'}
        size={18}
        tintColor={theme.color.text.dark}
      />
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});

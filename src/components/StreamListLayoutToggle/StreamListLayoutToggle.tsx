import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { selection } from '@app/lib/haptics';
import { type Preferences } from '@app/store/preferences/state';
import { theme } from '@app/styles/themes';

type StreamListLayout = Preferences['streamListLayout'];

export function StreamListLayoutToggle({
  value,
  onChange,
}: {
  value: StreamListLayout;
  onChange: (value: StreamListLayout) => void;
}) {
  const { t } = useTranslation('stream');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const isCompact = value === 'compact';

  return (
    <Button
      accessibilityRole='button'
      accessibilityLabel={
        isCompact ? t('switchToMediaLayout') : t('switchToCompactLayout')
      }
      hitSlop={10}
      onPress={() => {
        void selection();
        onChange(isCompact ? 'media' : 'compact');
      }}
      style={[
        styles.button,
        {
          backgroundColor: theme.color.backgroundAlt[scheme],
          borderColor: theme.color.border[scheme],
        },
      ]}
    >
      <SymbolView
        name={isCompact ? 'square.grid.2x2' : 'list.bullet'}
        size={18}
        tintColor={theme.color.text[scheme]}
      />
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});

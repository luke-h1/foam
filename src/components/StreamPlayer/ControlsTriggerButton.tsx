import { StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

export function ControlsTriggerButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topOffset =
    height >= width ? theme.space12 : insets.top + theme.space12;

  return (
    <PressableArea
      onPress={onPress}
      style={[styles.controlsTriggerButton, { top: topOffset }]}
      accessibilityLabel={t('showPlayerControls')}
      accessibilityRole='button'
    >
      <SymbolView name='ellipsis' size={24} tintColor={theme.colorWhite} />
    </PressableArea>
  );
}

const styles = StyleSheet.create({
  controlsTriggerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.58)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderCurve: 'continuous',
    borderWidth: 1,
    borderRadius: theme.borderRadius999,
    height: 44,
    justifyContent: 'center',
    padding: theme.space8,
    position: 'absolute',
    right: theme.space20,
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
    width: 44,
  },
});

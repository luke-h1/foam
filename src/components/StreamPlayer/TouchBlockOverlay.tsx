import { StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureDetector } from 'react-native-gesture-handler';

export function TouchBlockOverlay({
  gesture,
}: {
  gesture: ComponentProps<typeof GestureDetector>['gesture'];
}) {
  const { t } = useTranslation('common');

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.touchBlockOverlay}
        accessibilityLabel={t('showPlayerControls')}
        accessibilityRole='button'
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchBlockOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

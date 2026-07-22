import { StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { IconButton } from '@app/components/IconButton/IconButton';
import { BACK_SYMBOL_NAME } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

interface PlayerBackButtonProps {
  /**
   * Whether the button floats over the always-dark player surface. Over media
   * the chrome stays dark in every app theme; elsewhere it follows the scheme.
   */
  overMedia?: boolean;
}

export function PlayerBackButton({ overMedia = true }: PlayerBackButtonProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const chromeScheme = overMedia ? 'dark' : scheme;

  return (
    <IconButton
      icon={{ type: 'symbol', name: BACK_SYMBOL_NAME, size: 20 }}
      label={t('goBack')}
      onPress={() => router.back()}
      size='2xl'
      style={[
        styles.button,
        {
          backgroundColor: theme.color.pressedOverlay[chromeScheme],
          borderColor: theme.color.border[chromeScheme],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
});

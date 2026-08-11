import { router } from 'expo-router';

import { IconButton } from '@app/components/IconButton/IconButton';
import { BACK_SYMBOL_NAME } from '@app/components/ui/Icon/Icon';
import { theme } from '@app/styles/themes';

export function PlayerBackButton() {
  return (
    <IconButton
      icon={{ type: 'symbol', name: BACK_SYMBOL_NAME, size: 20 }}
      label='Go back'
      onPress={() => router.back()}
      size='2xl'
      style={{
        alignItems: 'center',
        backgroundColor: theme.darkActiveContent,
        borderColor: theme.colorBorderSecondary,
        borderCurve: 'continuous',
        borderRadius: theme.borderRadius999,
        borderWidth: 1,
        justifyContent: 'center',
      }}
    />
  );
}

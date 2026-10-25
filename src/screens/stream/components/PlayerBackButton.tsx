import { router } from 'expo-router';

import { BACK_SYMBOL_NAME } from '@app/components/ui/icon/constants';

import { PlayerIconButton } from './PlayerIconButton';

export function PlayerBackButton() {
  return (
    <PlayerIconButton
      icon={BACK_SYMBOL_NAME}
      label='Go back'
      onPress={() => router.back()}
    />
  );
}

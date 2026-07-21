import i18next from 'i18next';

import { showActionMenu } from '@app/store/overlays/showActionMenu';

import type { SleepTimer } from './useSleepTimer';

const SLEEP_TIMER_OPTIONS_MINUTES = [15, 30, 45, 60];

export function showSleepTimerMenu(sleepTimer: SleepTimer): void {
  const title = sleepTimer.isActive
    ? i18next.t('stream:sleepTimerRemaining', {
        minutes: sleepTimer.getRemainingMinutes(),
      })
    : i18next.t('stream:sleepTimer');

  const actions = SLEEP_TIMER_OPTIONS_MINUTES.map(minutes => ({
    label: i18next.t('stream:sleepTimerMinutes', { minutes }),
    onPress: () => sleepTimer.start(minutes),
  }));

  if (sleepTimer.isActive) {
    actions.push({
      label: i18next.t('stream:sleepTimerOff'),
      onPress: () => sleepTimer.cancel(),
    });
  }

  showActionMenu({
    title,
    actions,
    cancelLabel: i18next.t('common:cancel'),
  });
}

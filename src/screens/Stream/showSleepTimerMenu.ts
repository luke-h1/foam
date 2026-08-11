import { showActionMenu } from '@app/store/overlays/showActionMenu';

import type { SleepTimer } from './useSleepTimer';

const SLEEP_TIMER_OPTIONS_MINUTES = [15, 30, 45, 60];

export function showSleepTimerMenu(sleepTimer: SleepTimer): void {
  const title = sleepTimer.isActive
    ? `Sleep timer (${sleepTimer.getRemainingMinutes()} min left)`
    : 'Sleep timer';

  const actions = SLEEP_TIMER_OPTIONS_MINUTES.map(minutes => ({
    label: `${minutes} minutes`,
    onPress: () => sleepTimer.start(minutes),
  }));

  if (sleepTimer.isActive) {
    actions.push({
      label: 'Turn off',
      onPress: () => sleepTimer.cancel(),
    });
  }

  showActionMenu({
    title,
    actions,
    cancelLabel: 'Cancel',
  });
}

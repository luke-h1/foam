import type { AppStateTransition } from '@app/utils/appState/appStateTransitions';

export interface PlayerAppStateAction {
  /**
   * Read and remember whether the player was playing before this excursion.
   */
  capturePlayState: boolean;
  pausePlayer: boolean;
  resumePlayer: boolean;
}

/**
 * Only a full `background` pauses - `inactive` also fires for interruptions that never background the app (Control Center, Face ID) - while resume runs on every return to `active` because WebKit pauses inline video on some of those interruptions. Play state is captured on the first step away from `active`; WebKit's own pause can land before `background` and would read as a user pause.
 */
export function resolvePlayerAppStateAction({
  current,
  previous,
}: AppStateTransition): PlayerAppStateAction {
  return {
    capturePlayState: previous === 'active' && current !== 'active',
    pausePlayer: current === 'background',
    resumePlayer: current === 'active',
  };
}

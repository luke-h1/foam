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
 * Decides what an app-state transition should do to the stream player.
 *
 * Only a full `background` pauses: `inactive` also fires for interruptions that
 * never background the app (Control Center, notification pulldown, call banner,
 * Face ID, app-switcher peek), and pausing on those left the player stopped
 * with nothing to resume it. The resume, by contrast, runs on every return to
 * `active`, because WebKit pauses the inline video on some of those same
 * interruptions and nothing else brings it back.
 *
 * The play state is captured on the first step away from `active` rather than
 * on `background`, since `inactive` lands first and WebKit's own pause can
 * arrive in between - reading it later reports the user as having paused.
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

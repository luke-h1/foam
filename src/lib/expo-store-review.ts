import { storageService } from '@app/lib/storage';
import { recordWarning } from '@app/lib/sentry';
import {
  shouldRequestReview,
  type ReviewPromptState,
} from '@app/utils/storeReview/reviewPromptGate';
import { hasSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import * as Application from 'expo-application';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const STORE_REVIEW_STATE_KEY = 'store_review_state';

const initialState: ReviewPromptState = {
  sessionCount: 0,
  watchTimeMs: 0,
  lastPromptAt: null,
  lastPromptVersion: null,
};

let requestInFlight = false;

function getState(): ReviewPromptState {
  return (
    storageService.getString<ReviewPromptState>(STORE_REVIEW_STATE_KEY) ??
    initialState
  );
}

function setState(state: ReviewPromptState): void {
  storageService.set(STORE_REVIEW_STATE_KEY, state);
}

export function recordAppSession(): void {
  const state = getState();
  setState({ ...state, sessionCount: state.sessionCount + 1 });
}

export function recordWatchTime(durationMs: number): void {
  if (durationMs <= 0) {
    return;
  }
  const state = getState();
  setState({ ...state, watchTimeMs: state.watchTimeMs + durationMs });
}

/**
 * Request a store review if the user has earned a prompt (see
 * reviewPromptGate). Safe to call opportunistically; the gate plus the
 * OS-level throttle decide whether anything is shown.
 */
export async function maybeRequestStoreReview(): Promise<void> {
  if (Platform.OS === 'web' || requestInFlight) {
    return;
  }

  const currentVersion = Application.nativeApplicationVersion ?? 'unknown';
  const state = getState();

  if (
    !shouldRequestReview({
      state,
      currentVersion,
      sessionHadError: hasSessionError(),
      now: Date.now(),
    })
  ) {
    return;
  }

  requestInFlight = true;
  try {
    if (!(await StoreReview.hasAction())) {
      return;
    }

    // Mark before requesting: the OS gives no signal on whether the
    // dialog was shown, so assume it was and respect the cooldown.
    setState({
      ...getState(),
      lastPromptAt: Date.now(),
      lastPromptVersion: currentVersion,
    });

    await StoreReview.requestReview();
  } catch (error) {
    recordWarning({
      name: 'handled_warning',
      message: 'Store review request failed',
      warningCause: error,
    });
  } finally {
    requestInFlight = false;
  }
}

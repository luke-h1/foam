const DAY_MS = 24 * 60 * 60 * 1000;

const REVIEW_PROMPT_MIN_SESSIONS = 3;
const REVIEW_PROMPT_MIN_WATCH_TIME_MS = 30 * 60 * 1000;
export const REVIEW_PROMPT_COOLDOWN_MS = 90 * DAY_MS;

export interface ReviewPromptState {
  sessionCount: number;
  watchTimeMs: number;
  lastPromptAt: number | null;
  lastPromptVersion: string | null;
}

export interface ReviewPromptInput {
  state: ReviewPromptState;
  currentVersion: string;
  sessionHadError: boolean;
  now: number;
}

/**
 * Review prompts are rate-limited well below Apple/Google's hard caps:
 * only engaged users (3+ sessions, 30+ minutes watched), never in a
 * session that hit an error, at most once per app version, and at least
 * 90 days apart.
 */
export function shouldRequestReview({
  state,
  currentVersion,
  sessionHadError,
  now,
}: ReviewPromptInput): boolean {
  if (sessionHadError) {
    return false;
  }

  if (state.sessionCount < REVIEW_PROMPT_MIN_SESSIONS) {
    return false;
  }

  if (state.watchTimeMs < REVIEW_PROMPT_MIN_WATCH_TIME_MS) {
    return false;
  }

  if (state.lastPromptVersion === currentVersion) {
    return false;
  }

  if (
    state.lastPromptAt !== null &&
    now - state.lastPromptAt < REVIEW_PROMPT_COOLDOWN_MS
  ) {
    return false;
  }

  return true;
}

import {
  REVIEW_PROMPT_COOLDOWN_MS,
  type ReviewPromptState,
  shouldRequestReview,
} from '../reviewPromptGate';

const NOW = 1_750_000_000_000;

const eligibleState: ReviewPromptState = {
  sessionCount: 3,
  watchTimeMs: 30 * 60 * 1000,
  lastPromptAt: null,
  lastPromptVersion: null,
};

function gate(
  state: Partial<ReviewPromptState> = {},
  overrides: { currentVersion?: string; sessionHadError?: boolean } = {},
) {
  return shouldRequestReview({
    state: { ...eligibleState, ...state },
    currentVersion: overrides.currentVersion ?? '0.0.42',
    sessionHadError: overrides.sessionHadError ?? false,
    now: NOW,
  });
}

describe('shouldRequestReview', () => {
  test('allows an engaged, error-free user', () => {
    expect(gate()).toEqual(true);
  });

  test('blocks when the session had an error', () => {
    expect(gate({}, { sessionHadError: true })).toEqual(false);
  });

  test('blocks below the session threshold', () => {
    expect(gate({ sessionCount: 2 })).toEqual(false);
  });

  test('blocks below the watch-time threshold', () => {
    expect(gate({ watchTimeMs: 29 * 60 * 1000 })).toEqual(false);
  });

  test('blocks when already prompted on this version', () => {
    expect(
      gate({
        lastPromptVersion: '0.0.42',
        lastPromptAt: NOW - REVIEW_PROMPT_COOLDOWN_MS - 1,
      }),
    ).toEqual(false);
  });

  test('blocks inside the 90-day cooldown even on a new version', () => {
    expect(
      gate({
        lastPromptVersion: '0.0.41',
        lastPromptAt: NOW - REVIEW_PROMPT_COOLDOWN_MS + 1,
      }),
    ).toEqual(false);
  });

  test('allows after the cooldown on a new version', () => {
    expect(
      gate({
        lastPromptVersion: '0.0.41',
        lastPromptAt: NOW - REVIEW_PROMPT_COOLDOWN_MS,
      }),
    ).toEqual(true);
  });
});

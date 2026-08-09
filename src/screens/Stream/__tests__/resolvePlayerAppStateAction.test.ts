import type { PlayerAppStateAction } from '@app/screens/Stream/resolvePlayerAppStateAction';
import { resolvePlayerAppStateAction } from '@app/screens/Stream/resolvePlayerAppStateAction';

describe('resolvePlayerAppStateAction', () => {
  test('captures the play state on the first step away from active', () => {
    expect(
      resolvePlayerAppStateAction({ previous: 'active', current: 'inactive' }),
    ).toEqual<PlayerAppStateAction>({
      capturePlayState: true,
      pausePlayer: false,
      resumePlayer: false,
    });
  });

  test('does not re-capture when background follows inactive', () => {
    expect(
      resolvePlayerAppStateAction({
        previous: 'inactive',
        current: 'background',
      }),
    ).toEqual<PlayerAppStateAction>({
      capturePlayState: false,
      pausePlayer: true,
      resumePlayer: false,
    });
  });

  test('captures and pauses when active goes straight to background', () => {
    expect(
      resolvePlayerAppStateAction({
        previous: 'active',
        current: 'background',
      }),
    ).toEqual<PlayerAppStateAction>({
      capturePlayState: true,
      pausePlayer: true,
      resumePlayer: false,
    });
  });

  test('resumes when returning from a full background', () => {
    expect(
      resolvePlayerAppStateAction({
        previous: 'background',
        current: 'active',
      }),
    ).toEqual<PlayerAppStateAction>({
      capturePlayState: false,
      pausePlayer: false,
      resumePlayer: true,
    });
  });

  test('resumes when returning from an inactive-only interruption', () => {
    expect(
      resolvePlayerAppStateAction({ previous: 'inactive', current: 'active' }),
    ).toEqual<PlayerAppStateAction>({
      capturePlayState: false,
      pausePlayer: false,
      resumePlayer: true,
    });
  });
});

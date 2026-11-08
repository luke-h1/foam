import { buildTwitchPlayerAudioDefaultScript } from '../buildTwitchPlayerAudioDefaultScript';
import {
  resetPlayerPage,
  runPlayerScript,
} from './__fixtures__/twitchPlayerSource.fixture';

describe('buildTwitchPlayerAudioDefaultScript', () => {
  beforeEach(() => {
    resetPlayerPage();
  });

  test.each([
    {
      muted: true,
      previousMuted: '{"default":false}',
      storedMuted: '{"default":true}',
    },
    {
      muted: false,
      previousMuted: '{"default":true}',
      storedMuted: '{"default":false}',
    },
  ])(
    'replaces video-muted $previousMuted with $storedMuted and sets full volume when muted is $muted',
    ({ muted, previousMuted, storedMuted }) => {
      localStorage.setItem('video-muted', previousMuted);
      localStorage.setItem('volume', '0.2');

      runPlayerScript(buildTwitchPlayerAudioDefaultScript({ muted }));

      expect(localStorage.getItem('video-muted')).toBe(storedMuted);

      expect(localStorage.getItem('volume')).toBe('1');
    },
  );
});

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
    { muted: true, storedMuted: '{"default":true}' },
    { muted: false, storedMuted: '{"default":false}' },
  ])(
    'stores video-muted as $storedMuted and full volume when muted is $muted',
    ({ muted, storedMuted }) => {
      localStorage.setItem('video-muted', '{"default":true}');
      localStorage.setItem('volume', '0.2');

      runPlayerScript(buildTwitchPlayerAudioDefaultScript({ muted }));

      expect(localStorage.getItem('video-muted')).toBe(storedMuted);

      expect(localStorage.getItem('volume')).toBe('1');
    },
  );
});

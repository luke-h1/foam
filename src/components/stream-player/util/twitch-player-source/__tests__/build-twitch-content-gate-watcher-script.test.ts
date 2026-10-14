import { buildTwitchContentGateWatcherScript } from '../build-twitch-content-gate-watcher-script';
import {
  flushMutations,
  type PlayerBridgeMessage,
  resetPlayerPage,
  runPlayerScript,
  setPageBody,
} from './__fixtures__/twitch-player-source.fixture';

const LOGIN_GATE = `
  <div data-a-target="content-classification-gate-overlay">
    <a href="https://www.twitch.tv/login">Log in</a>
  </div>
`;

const MATURE_GATE = `
  <div data-a-target="content-classification-gate-overlay">
    <button data-a-target="content-classification-gate-overlay-start-watching-button">
      Start Watching
    </button>
  </div>
`;

function gateMessage(hasContentGate: boolean): PlayerBridgeMessage {
  return {
    type: 'contentGateDetected',
    payload: { hasContentGate },
  };
}

describe('buildTwitchContentGateWatcherScript', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetPlayerPage();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reports a login-required gate as blocking', () => {
    setPageBody(LOGIN_GATE);

    const page = runPlayerScript(buildTwitchContentGateWatcherScript());

    jest.advanceTimersByTime(3000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([gateMessage(true)]);
  });

  test('does not treat the mature gate with a continue button as blocking', () => {
    setPageBody(MATURE_GATE);

    const page = runPlayerScript(buildTwitchContentGateWatcherScript());

    jest.advanceTimersByTime(3000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([gateMessage(false)]);
  });

  test('waits before reporting a cleared gate', async () => {
    setPageBody(LOGIN_GATE);

    const page = runPlayerScript(buildTwitchContentGateWatcherScript());

    setPageBody('');
    await flushMutations();
    jest.advanceTimersByTime(500);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([gateMessage(true)]);

    jest.advanceTimersByTime(100);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      gateMessage(true),
      gateMessage(false),
    ]);
  });

  test('stays interactive when the login link leaves the player for the auth flow', async () => {
    setPageBody(LOGIN_GATE);

    const page = runPlayerScript(buildTwitchContentGateWatcherScript());

    setPageBody('');
    await flushMutations();
    page.window.location.hostname = 'www.twitch.tv';
    jest.advanceTimersByTime(5000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([gateMessage(true)]);
  });

  test('does not report from a subframe', () => {
    setPageBody(LOGIN_GATE);

    const page = runPlayerScript(buildTwitchContentGateWatcherScript(), {
      isTopFrame: false,
    });

    jest.advanceTimersByTime(3000);

    expect(page.messages).toEqual([]);
  });
});

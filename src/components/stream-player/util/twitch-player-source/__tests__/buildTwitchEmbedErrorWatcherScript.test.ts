import { buildTwitchEmbedErrorWatcherScript } from '../buildTwitchEmbedErrorWatcherScript';
import {
  type PlayerBridgeMessage,
  resetPlayerPage,
  runPlayerScript,
  setPageBody,
} from './__fixtures__/twitchPlayerSource.fixture';

const MISCONFIGURED_PAGE = '<p>Whoops, this embed is misconfigured.</p>';

const misconfiguredMessage: PlayerBridgeMessage = {
  type: 'embedMisconfigured',
  payload: {
    message: 'Whoops, this embed is misconfigured',
    parent: 'foam.app',
  },
};

describe('buildTwitchEmbedErrorWatcherScript', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetPlayerPage();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reports the misconfigured page once, with the parent from the embed url', () => {
    setPageBody(MISCONFIGURED_PAGE);

    const page = runPlayerScript(buildTwitchEmbedErrorWatcherScript(), {
      search: '?channel=xqc&parent=foam.app',
    });

    jest.advanceTimersByTime(20_000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      misconfiguredMessage,
    ]);
  });

  test('reports an error page that appears a few seconds after load', () => {
    const page = runPlayerScript(buildTwitchEmbedErrorWatcherScript(), {
      search: '?parent=foam.app',
    });

    jest.advanceTimersByTime(3000);

    expect(page.messages).toEqual([]);

    setPageBody(MISCONFIGURED_PAGE);
    jest.advanceTimersByTime(1000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      misconfiguredMessage,
    ]);
  });

  test('stops watching once the player video loads', () => {
    setPageBody('<video></video>');

    const page = runPlayerScript(buildTwitchEmbedErrorWatcherScript());

    setPageBody(MISCONFIGURED_PAGE);
    jest.advanceTimersByTime(5000);

    expect(page.messages).toEqual([]);
  });

  test('gives up after about 15 seconds', () => {
    const page = runPlayerScript(buildTwitchEmbedErrorWatcherScript());

    jest.advanceTimersByTime(15_000);
    setPageBody(MISCONFIGURED_PAGE);
    jest.advanceTimersByTime(5000);

    expect(page.messages).toEqual([]);
  });

  test('does not report from a subframe', () => {
    setPageBody(MISCONFIGURED_PAGE);

    const page = runPlayerScript(buildTwitchEmbedErrorWatcherScript(), {
      isTopFrame: false,
    });

    jest.advanceTimersByTime(5000);

    expect(page.messages).toEqual([]);
  });
});

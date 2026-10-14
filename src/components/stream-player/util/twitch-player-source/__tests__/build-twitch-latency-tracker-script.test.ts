import { buildTwitchLatencyTrackerScript } from '../build-twitch-latency-tracker-script';
import {
  type PlayerBridgeMessage,
  resetPlayerPage,
  runPlayerScript,
  setPageBody,
} from './__fixtures__/twitch-player-source.fixture';

const SETTINGS_MENU = `
  <video></video>
  <button data-a-target="player-settings-button">Settings</button>
  <div data-a-target="player-settings-menu">
    <button data-a-target="player-settings-menu-item-advanced">Advanced</button>
    <div data-a-target="player-settings-submenu-advanced-video-stats">
      <input type="checkbox" />
    </div>
  </div>
`;

function latencyPage(latency: string): string {
  return `
    <video></video>
    <div data-a-target="player-overlay-video-stats">
      <p aria-label="Latency To Broadcaster">${latency}</p>
    </div>
  `;
}

function statsMessage(hlsLatencyBroadcaster: number): PlayerBridgeMessage {
  return {
    type: 'playbackStats',
    payload: {
      bufferSize: null,
      displayResolution: null,
      fps: null,
      hlsLatencyBroadcaster,
      playbackRate: null,
      skippedFrames: null,
      videoResolution: null,
    },
  };
}

function setLatencyText(text: string) {
  const node = document.querySelector('[aria-label="Latency To Broadcaster"]');

  if (!node) {
    throw new Error('latency node is missing');
  }

  node.textContent = text;
}

describe('buildTwitchLatencyTrackerScript', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetPlayerPage();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('posts the broadcaster latency from the stats overlay and keeps the overlay hidden', () => {
    setPageBody(latencyPage('2.31 sec.'));

    const page = runPlayerScript(buildTwitchLatencyTrackerScript());

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([statsMessage(2.31)]);

    const overlay = document.querySelector(
      '[data-a-target="player-overlay-video-stats"]',
    );

    expect(overlay && getComputedStyle(overlay).display).toBe('none');
  });

  test('posts again only when the latency moves by a quarter second or more', () => {
    setPageBody(latencyPage('2.0 sec.'));

    const page = runPlayerScript(buildTwitchLatencyTrackerScript());

    setLatencyText('2.2 sec.');
    jest.advanceTimersByTime(4000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([statsMessage(2)]);

    setLatencyText('2.5 sec.');
    jest.advanceTimersByTime(4000);

    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      statsMessage(2),
      statsMessage(2.5),
    ]);
  });

  test('turns on video stats through the settings menu when the latency node is missing', async () => {
    setPageBody(SETTINGS_MENU);

    const checkbox = document.querySelector<HTMLInputElement>(
      '[data-a-target="player-settings-submenu-advanced-video-stats"] input',
    );

    const page = runPlayerScript(buildTwitchLatencyTrackerScript());

    await jest.advanceTimersByTimeAsync(0);

    expect(checkbox?.checked).toBe(true);
    expect(page.messages).toEqual<PlayerBridgeMessage[]>([
      {
        type: 'trace',
        payload: { step: 'latency', detail: 'enable attempt 1 toggled' },
      },
    ]);
  });

  test('does not read latency while an ad is playing', () => {
    setPageBody(
      `${latencyPage('2.31 sec.')}<span data-a-target="video-ad-label">Ad</span>`,
    );

    const page = runPlayerScript(buildTwitchLatencyTrackerScript());

    jest.advanceTimersByTime(8000);

    expect(page.messages).toEqual([]);
  });
});

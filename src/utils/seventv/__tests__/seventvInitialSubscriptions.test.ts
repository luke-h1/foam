import { setupInitialSubscriptions } from '@app/utils/seventv/seventvInitialSubscriptions';
import {
  createSeventvSessionState,
  type SeventvSessionState,
} from '@app/utils/seventv/seventvSessionState';
import {
  buildCosmeticCreateSubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  buildUserUpdateSubscribeMessage,
} from '@app/utils/seventv/seventvWsInterpreter';

interface SetupHarness {
  session: SeventvSessionState;
  sendJsonMessage: jest.Mock;
  ids: {
    twitchChannelId: string | undefined;
    sevenTvChannelUserId: string | undefined;
    sevenTvEmoteSetId: string | undefined;
  };
  run: () => Promise<void>;
}

const createHarness = (ids: SetupHarness['ids']): SetupHarness => {
  const session = createSeventvSessionState({
    defaultHeartbeatIntervalMs: 30_000,
  });
  const sendJsonMessage = jest.fn();
  const harness: SetupHarness = {
    session,
    sendJsonMessage,
    ids,
    run: () =>
      setupInitialSubscriptions({
        getSevenTvChannelUserId: () => harness.ids.sevenTvChannelUserId,
        getSevenTvEmoteSetId: () => harness.ids.sevenTvEmoteSetId,
        getTwitchChannelId: () => harness.ids.twitchChannelId,
        sendJsonMessage,
        session,
      }),
  };
  return harness;
};

describe('setupInitialSubscriptions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_700_000_000_000);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('subscribes channel streams, owner and emote set when every id is present', async () => {
    const harness = createHarness({
      twitchChannelId: 'channel-1',
      sevenTvChannelUserId: 'owner-1',
      sevenTvEmoteSetId: 'set-1',
    });

    await harness.run();

    expect(harness.sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateSubscribeMessage('channel-1', Date.now())],
      [buildCosmeticCreateSubscribeMessage('channel-1', Date.now())],
      [buildUserUpdateSubscribeMessage('owner-1')],
      [buildEmoteSetUpdateSubscribeMessage('set-1', Date.now())],
    ]);
    expect(harness.session.subscribedChannelId).toBe('channel-1');
    expect(harness.session.subscribedOwnerId).toBe('owner-1');
    expect(harness.session.hasInitialSubscriptions).toBe(true);
  });

  test('waits for the channel id to resolve before subscribing', async () => {
    const harness = createHarness({
      twitchChannelId: undefined,
      sevenTvChannelUserId: undefined,
      sevenTvEmoteSetId: 'set-1',
    });

    const setup = harness.run();
    await jest.advanceTimersByTimeAsync(2_000);
    expect(harness.sendJsonMessage).not.toHaveBeenCalled();

    harness.ids.twitchChannelId = 'channel-1';
    await jest.advanceTimersByTimeAsync(1_000);
    await setup;

    expect(harness.sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateSubscribeMessage('channel-1', Date.now())],
      [buildCosmeticCreateSubscribeMessage('channel-1', Date.now())],
      [buildEmoteSetUpdateSubscribeMessage('set-1', Date.now())],
    ]);
    expect(harness.session.subscribedChannelId).toBe('channel-1');
    expect(harness.session.hasInitialSubscriptions).toBe(true);
  });

  test('a session reset mid-poll stops the stale run from subscribing the old channel', async () => {
    const harness = createHarness({
      twitchChannelId: undefined,
      sevenTvChannelUserId: 'owner-1',
      sevenTvEmoteSetId: 'set-1',
    });

    const setup = harness.run();
    await jest.advanceTimersByTimeAsync(1_000);

    harness.session.reset('leave');
    harness.ids.twitchChannelId = 'old-channel';
    await jest.advanceTimersByTimeAsync(1_000);
    await setup;

    expect(harness.sendJsonMessage).not.toHaveBeenCalled();
    expect(harness.session.subscribedChannelId).toBeNull();
    expect(harness.session.hasInitialSubscriptions).toBe(false);
  });

  test('a channel hop mid-poll stops the stale run from subscribing the old channel', async () => {
    const harness = createHarness({
      twitchChannelId: undefined,
      sevenTvChannelUserId: undefined,
      sevenTvEmoteSetId: 'set-1',
    });
    harness.session.noteChannelId('old-channel');

    const setup = harness.run();
    await jest.advanceTimersByTimeAsync(1_000);

    harness.session.noteChannelId('new-channel');
    harness.ids.twitchChannelId = 'old-channel';
    await jest.advanceTimersByTimeAsync(1_000);
    await setup;

    expect(harness.sendJsonMessage).not.toHaveBeenCalled();
    expect(harness.session.subscribedChannelId).toBeNull();
    expect(harness.session.hasInitialSubscriptions).toBe(false);
  });

  test('a close mid-wait on the emote-set id leaves the channel subscribed but never marks the run complete', async () => {
    const harness = createHarness({
      twitchChannelId: 'channel-1',
      sevenTvChannelUserId: 'owner-1',
      sevenTvEmoteSetId: undefined,
    });

    const startTime = Date.now();
    const setup = harness.run();
    await jest.advanceTimersByTimeAsync(1_000);

    const callsBeforeReset = harness.sendJsonMessage.mock.calls.length;
    harness.session.reset('close');
    harness.ids.sevenTvEmoteSetId = 'set-1';
    await jest.advanceTimersByTimeAsync(1_000);
    await setup;

    expect(callsBeforeReset).toBe(3);
    expect(harness.sendJsonMessage.mock.calls).toEqual([
      [buildEntitlementCreateSubscribeMessage('channel-1', startTime)],
      [buildCosmeticCreateSubscribeMessage('channel-1', startTime)],
      [buildUserUpdateSubscribeMessage('owner-1')],
    ]);
    expect(harness.session.hasInitialSubscriptions).toBe(false);
  });

  test('gives up on a channel id after the 30s budget and still finishes the run', async () => {
    const harness = createHarness({
      twitchChannelId: undefined,
      sevenTvChannelUserId: 'owner-1',
      sevenTvEmoteSetId: 'set-1',
    });

    const setup = harness.run();
    await jest.advanceTimersByTimeAsync(30_000);
    await setup;

    expect(harness.sendJsonMessage.mock.calls).toEqual([
      [buildUserUpdateSubscribeMessage('owner-1')],
      [buildEmoteSetUpdateSubscribeMessage('set-1', Date.now())],
    ]);
    expect(harness.session.subscribedChannelId).toBeNull();
    expect(harness.session.hasInitialSubscriptions).toBe(true);
  });
});

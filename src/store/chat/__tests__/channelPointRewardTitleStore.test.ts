import type * as ChannelPointRewardTitleStore from '../actions/channelPointRewardTitleStore';

let clearChannelPointRewardTitles: typeof ChannelPointRewardTitleStore.clearChannelPointRewardTitles;
let cacheChannelPointRewardTitle: typeof ChannelPointRewardTitleStore.cacheChannelPointRewardTitle;
let enrichChannelPointPrivmsgTags: typeof ChannelPointRewardTitleStore.enrichChannelPointPrivmsgTags;
let registerDeferredRewardgiftStandalone: typeof ChannelPointRewardTitleStore.registerDeferredRewardgiftStandalone;
let resolveChannelPointRewardTitle: typeof ChannelPointRewardTitleStore.resolveChannelPointRewardTitle;

describe('channelPointRewardTitleStore', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.resetModules();
    const store: typeof ChannelPointRewardTitleStore = require('../actions/channelPointRewardTitleStore');

    ({
      clearChannelPointRewardTitles,
      cacheChannelPointRewardTitle,
      enrichChannelPointPrivmsgTags,
      registerDeferredRewardgiftStandalone,
      resolveChannelPointRewardTitle,
    } = store);
  });

  test('enriches PRIVMSG tags from cache after rewardgift notice', () => {
    cacheChannelPointRewardTitle('67890', 'reward-tts', 'Chinese TTS');

    const enriched = enrichChannelPointPrivmsgTags(
      {
        login: 'testuser',
        'display-name': 'testUser',
        'custom-reward-id': 'reward-tts',
      },
      '67890',
    );

    expect(enriched['msg-param-custom-reward-title']).toBe('Chinese TTS');
  });

  test('cancels deferred standalone notice when matching PRIVMSG arrives', () => {
    jest.useFakeTimers();
    const publish = jest.fn();
    const unmatchedPublish = jest.fn();

    registerDeferredRewardgiftStandalone({
      login: 'testuser',
      rewardId: 'reward-tts',
      publish,
    });

    registerDeferredRewardgiftStandalone({
      login: 'otheruser',
      rewardId: 'reward-tts',
      publish: unmatchedPublish,
    });

    enrichChannelPointPrivmsgTags(
      {
        login: 'testuser',
        'custom-reward-id': 'reward-tts',
      },
      '67890',
    );

    jest.advanceTimersByTime(600);

    expect({
      matched: publish.mock.calls.length,
      unmatched: unmatchedPublish.mock.calls.length,
    }).toEqual({ matched: 0, unmatched: 1 });
  });

  test('resolveChannelPointRewardTitle falls back to reward id cache', () => {
    cacheChannelPointRewardTitle('67890', 'reward-tts', 'Chinese TTS');

    expect(
      resolveChannelPointRewardTitle({
        tags: { 'custom-reward-id': 'reward-tts' },
      }),
    ).toBe('Chinese TTS');
  });

  test('does not resolve a title cached under a different reward id', () => {
    cacheChannelPointRewardTitle('67890', 'reward-tts', 'Chinese TTS');

    expect(
      resolveChannelPointRewardTitle({
        tags: { 'custom-reward-id': 'reward-other' },
      }),
    ).toBeUndefined();
  });

  test('clear cancels a deferred notice and drops cached titles', () => {
    jest.useFakeTimers();
    const publish = jest.fn();

    cacheChannelPointRewardTitle('67890', 'reward-tts', 'Chinese TTS');
    registerDeferredRewardgiftStandalone({
      login: 'testuser',
      rewardId: 'reward-tts',
      publish,
    });

    clearChannelPointRewardTitles();
    jest.advanceTimersByTime(500);

    expect({
      published: publish.mock.calls.length,
      title: resolveChannelPointRewardTitle({
        tags: { 'custom-reward-id': 'reward-tts', 'room-id': '67890' },
      }),
    }).toEqual({ published: 0, title: undefined });
  });
});

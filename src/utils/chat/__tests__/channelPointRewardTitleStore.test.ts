import type * as ChannelPointRewardTitleStore from '../channelPointRewardTitleStore';

let cacheChannelPointRewardTitle: typeof ChannelPointRewardTitleStore.cacheChannelPointRewardTitle;
let enrichChannelPointPrivmsgTags: typeof ChannelPointRewardTitleStore.enrichChannelPointPrivmsgTags;
let registerDeferredRewardgiftStandalone: typeof ChannelPointRewardTitleStore.registerDeferredRewardgiftStandalone;
let resolveChannelPointRewardTitle: typeof ChannelPointRewardTitleStore.resolveChannelPointRewardTitle;

describe('channelPointRewardTitleStore', () => {
  beforeEach(() => {
    jest.resetModules();
    const store: typeof ChannelPointRewardTitleStore = require('../channelPointRewardTitleStore');
    ({
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

    registerDeferredRewardgiftStandalone({
      login: 'testuser',
      rewardId: 'reward-tts',
      publish,
    });

    enrichChannelPointPrivmsgTags(
      {
        login: 'testuser',
        'custom-reward-id': 'reward-tts',
      },
      '67890',
    );

    jest.advanceTimersByTime(600);

    expect(publish).not.toHaveBeenCalled();
    jest.useRealTimers();
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
});

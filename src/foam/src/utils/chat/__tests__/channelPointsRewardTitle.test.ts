import {
  channelPointsRewardTitleFromSystemMsg,
  channelPointsRewardTitleFromTags,
} from '../channelPointsRewardTitle';

describe('channelPointsRewardTitle', () => {
  test('parses reward title from system-msg', () => {
    expect(
      channelPointsRewardTitleFromSystemMsg('testUser redeemed Chinese TTS'),
    ).toBe('Chinese TTS');
  });

  test('prefers msg-param-custom-reward-title over system-msg', () => {
    expect(
      channelPointsRewardTitleFromTags({
        'msg-param-custom-reward-title': 'Hydrate',
        'system-msg': 'RewardUser redeemed Chinese TTS',
      }),
    ).toBe('Hydrate');
  });

  test('falls back to system-msg when reward params are missing', () => {
    expect(
      channelPointsRewardTitleFromTags({
        'system-msg': 'RewardUser redeemed Hydrate',
      }),
    ).toBe('Hydrate');
  });
});

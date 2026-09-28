import { channelPointsRewardTitleFromSystemMsg } from '../channel-points-reward-title-from-system-msg';

describe('channelPointsRewardTitleFromSystemMsg', () => {
  test('parses reward title from system-msg', () => {
    expect(
      channelPointsRewardTitleFromSystemMsg('testUser redeemed Chinese TTS'),
    ).toBe('Chinese TTS');
  });
});

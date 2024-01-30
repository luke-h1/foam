import twitchBadgeService, {
  ChannelBadges,
} from '@app/services/twitchBadgeService';
import { GLOBAL_CHANNEL_KEY } from '../config';

const $BADGES: ChannelBadges = new Map();

export const getBadges = async (channelId: string) => {
  // eslint-disable-next-line no-param-reassign
  let storedGlobalBadges = $BADGES.get(GLOBAL_CHANNEL_KEY);
  let storedChannelBadges = $BADGES.get(channelId);

  if (!storedGlobalBadges) {
    const globalBadges = await twitchBadgeService.fetchGlobalBadges();
    $BADGES.set(
      GLOBAL_CHANNEL_KEY,
      new Map(
        Object.keys(globalBadges.badge_sets).map(code => [
          code,
          globalBadges.badge_sets[code].versions,
        ]),
      ),
    );
  }

  if (!storedChannelBadges) {
    const channelBadges =
      await twitchBadgeService.fetchChannelBadges(channelId);
    $BADGES.set(
      channelId,
      new Map(
        Object.keys(channelBadges.badge_sets).map(code => [
          code,
          channelBadges.badge_sets[code].versions,
        ]),
      ),
    );
  }

  storedGlobalBadges = $BADGES.get(GLOBAL_CHANNEL_KEY);
  storedChannelBadges = $BADGES.get(channelId);
  if (!storedGlobalBadges || !storedChannelBadges) {
    // eslint-disable-next-line no-console
    console.error('Could not retrieve stored badges');
    return new Map();
  }
  return new Map([...storedGlobalBadges, ...storedChannelBadges]);
};

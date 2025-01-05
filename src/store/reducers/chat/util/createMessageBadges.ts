import {
  AllBadges,
  MessageBadge,
  MessageBadgeType,
} from './messages/types/badges';

export default function createMessageBadges(
  allBadges: AllBadges,
  twitchBadges: Record<string, string>,
  userId: string,
): MessageBadge[] {
  const badges: MessageBadge[] = [];

  const twitchBadgesEntries = Object.entries(twitchBadges);
  const twitchBadgesArray: MessageBadge[] = twitchBadgesEntries.map(
    ([id, version]) => ({
      type: MessageBadgeType.TWITCH,
      id,
      version,
    }),
  );
  badges.push(...twitchBadgesArray);

  const bttvBadges = allBadges.bttv?.users[userId] || [];
  const ffzBadges = allBadges.ffz?.users[userId] || [];
  const ffzApBadges = allBadges.ffzAp?.users[userId] || [];
  const stvBadges = allBadges.stv?.users[userId] || [];
  const chBadges = allBadges.chatterino?.users[userId] || [];

  bttvBadges.forEach(id => badges.push({ type: MessageBadgeType.BTTV, id }));
  ffzBadges.forEach(id => badges.push({ type: MessageBadgeType.FFZ, id }));
  ffzApBadges.forEach(id => badges.push({ type: MessageBadgeType.FFZ_AP, id }));
  stvBadges.forEach(id => badges.push({ type: MessageBadgeType.STV, id }));
  chBadges.forEach(id =>
    badges.push({ type: MessageBadgeType.CHATTERINO, id }),
  );
  return badges;
}

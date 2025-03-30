import {
  AllBadges,
  MessageBadge,
  MessageBadgeType,
} from '../services/types/badges/types';

/* eslint-disable no-restricted-syntax */
const createMessageBadges = (
  allBadges: AllBadges,
  twitchBadges: Record<string, string>,
  userId: string,
): MessageBadge[] => {
  const badges: MessageBadge[] = [];

  for (const [id, version] of Object.entries(twitchBadges)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    badges.push([MessageBadgeType.TWITCH, id, version]);
  }

  const bttvBadges = allBadges.bttv?.users[userId] || [];
  const ffzBadges = allBadges.ffz?.users[userId] || [];
  const ffzApBadges = allBadges.ffzAp?.users[userId] || [];
  const stvBadges = allBadges.stv?.users[userId] || [];
  const chBadges = allBadges.chatterino?.users[userId] || [];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const id of bttvBadges) badges.push([MessageBadgeType.BTTV, id]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const id of ffzBadges) badges.push([MessageBadgeType.FFZ, id]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const id of ffzApBadges) badges.push([MessageBadgeType.FFZ_AP, id]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const id of stvBadges) badges.push([MessageBadgeType.STV, id]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const id of chBadges) badges.push([MessageBadgeType.CHATTERINO, id]);

  return badges;
};

export default createMessageBadges;

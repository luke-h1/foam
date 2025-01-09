import {
  ChatterinoBadge,
  ChatterinoBadgesResponse,
} from '@app/services/chatterinoService';
import { Badge } from '@app/services/types/util';

export const parseChatterinoBadges = ({
  badges,
}: ChatterinoBadgesResponse): Badge<ChatterinoBadge> => {
  const result: Badge<ChatterinoBadge> = { entries: {}, users: {} };

  let i = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const { users, ...badge } of badges) {
    result.entries[i] = badge;

    // eslint-disable-next-line no-restricted-syntax
    for (const userId of users) {
      if (!result.users[userId]) result.users[userId] = [];

      result.users[userId].push(i.toString());
    }

    i += 1;
  }

  return result;
};

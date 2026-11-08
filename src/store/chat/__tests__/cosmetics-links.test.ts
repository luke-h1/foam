import {
  clearEntitlementUserLinkState,
  getSevenTvUserIdForTwitchId,
  getTwitchIdsForSevenTvUser,
  rememberSevenTvUserTwitchLink,
  unlinkSevenTvUser,
} from '../actions/cosmetics-links';

describe('cosmetics links', () => {
  beforeEach(() => {
    clearEntitlementUserLinkState();
  });

  test('a relinked Twitch id leaves the old 7TV user, so unlinking it keeps the new link', () => {
    rememberSevenTvUserTwitchLink('stv-old', 'ttv-1');
    rememberSevenTvUserTwitchLink('stv-new', 'ttv-1');

    unlinkSevenTvUser('stv-old');

    expect({
      sevenTvUserId: getSevenTvUserIdForTwitchId('ttv-1'),
      newUserTwitchIds: getTwitchIdsForSevenTvUser('stv-new'),
    }).toEqual({ sevenTvUserId: 'stv-new', newUserTwitchIds: ['ttv-1'] });
  });
});

import { UserBlockList } from '@app/services/twitch-service';

export const userBlockListFixture: UserBlockList[] = [
  {
    user_id: '111111111',
    user_login: 'blockeduser1',
    display_name: 'BlockedUser1',
  },
  {
    user_id: '222222222',
    user_login: 'blockeduser2',
    display_name: 'BlockedUser2',
  },
  {
    user_id: '333333333',
    user_login: 'blockeduser3',
    display_name: 'BlockedUser3',
  },
  {
    user_id: '444444444',
    user_login: 'blockeduser4',
    display_name: 'BlockedUser4',
  },
  {
    user_id: '555555555',
    user_login: 'blockeduser5',
    display_name: 'BlockedUser5',
  },
];

export const manyUserBlockListFixture: UserBlockList[] = [
  ...userBlockListFixture,
  {
    user_id: '666666666',
    user_login: 'blockeduser6',
    display_name: 'BlockedUser6',
  },
  {
    user_id: '777777777',
    user_login: 'blockeduser7',
    display_name: 'BlockedUser7',
  },
  {
    user_id: '888888888',
    user_login: 'blockeduser8',
    display_name: 'BlockedUser8',
  },
  {
    user_id: '999999999',
    user_login: 'blockeduser9',
    display_name: 'BlockedUser9',
  },
  {
    user_id: '101010101',
    user_login: 'blockeduser10',
    display_name: 'BlockedUser10',
  },
];

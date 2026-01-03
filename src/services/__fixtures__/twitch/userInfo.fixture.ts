import { UserInfoResponse } from '@app/services/twitch-service';

export const userInfoFixture: UserInfoResponse = {
  broadcaster_type: 'partner',
  created_at: '2013-06-03T19:12:02Z',
  description: 'Test user',
  display_name: 'TestUser',
  id: '123456789',
  login: 'testuser',
  offline_image_url: '',
  profile_image_url: 'https://via.placeholder.com/150',
  type: '',
  view_count: 1000,
};

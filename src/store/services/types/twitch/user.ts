import { components } from '../generated/twitch.generated';

export type TwitchUser = components['schemas']['User'];
export type TwitchGetUsersResponse = components['schemas']['GetUsersResponse'];

export type TwitchUserBlockListsResponse =
  components['schemas']['GetUserBlockListResponse'];
export type TwitchClipsResponse = components['schemas']['GetClipsResponse'];
export type TwitchVideosResponse = components['schemas']['GetVideosResponse'];

export type JwtPayload = {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  at_hash: string;
  email_verified: boolean;
  picture: string;
  preferred_username: string;
};

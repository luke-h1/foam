import { QueryClient } from '@tanstack/react-query';

import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';

import { sevenTvBadgesQueryOptions } from '../emotes';
import { followedChannelProfileImagesQueryOptions } from '../twitch';

const createClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always', gcTime: Infinity },
    },
  });

describe('query failures', () => {
  test('a failed profile image lookup rejects instead of caching an empty map', async () => {
    jest
      .spyOn(twitchService, 'getUsersById')
      .mockRejectedValueOnce(new Error('Helix down'));

    const client = createClient();
    const options = followedChannelProfileImagesQueryOptions(['1', '2']);

    await expect(client.fetchQuery(options)).rejects.toThrow('Helix down');

    expect(client.getQueryData(options.queryKey)).toEqual(undefined);
  });

  test('a failed 7TV badge fetch rejects instead of caching an empty list', async () => {
    jest
      .spyOn(sevenTvService, 'fetchAllBadges')
      .mockRejectedValueOnce(new Error('7TV GQL error'));

    const client = createClient();
    const options = sevenTvBadgesQueryOptions();

    await expect(client.fetchQuery(options)).rejects.toThrow('7TV GQL error');

    expect(client.getQueryData(options.queryKey)).toEqual(undefined);
  });
});

import { sevenTvApi } from '@app/services/api/clients';
import { sevenTvService } from '@app/services/seventv-service';

jest.mock('@app/services/api/clients', () => ({
  sevenTvApi: {
    post: jest.fn(),
  },
}));

const mockSevenTvApiPost = jest.mocked(sevenTvApi.post);

describe('sevenTvService.fetchBridgedCosmetics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns an empty array without calling the bridge when no logins are provided', async () => {
    await expect(sevenTvService.fetchBridgedCosmetics([])).resolves.toEqual([]);
    expect(mockSevenTvApiPost).not.toHaveBeenCalled();
  });

  test('queries the bridge with username identifiers', async () => {
    mockSevenTvApiPost.mockResolvedValue([]);

    await sevenTvService.fetchBridgedCosmetics(['Cinna', 'destiny']);

    expect(mockSevenTvApiPost.mock.calls).toEqual([
      [
        '/bridge/event-api',
        { identifiers: ['username:Cinna', 'username:destiny'] },
      ],
    ]);
  });

  test('normalises a non-array bridge response to an empty array', async () => {
    mockSevenTvApiPost.mockResolvedValue(null);

    await expect(
      sevenTvService.fetchBridgedCosmetics(['cinna']),
    ).resolves.toEqual([]);
  });

  test('returns bridge events unchanged when the API responds with an array', async () => {
    const events = [{ type: 'cosmetic.create', body: { id: 'abc' } }];
    mockSevenTvApiPost.mockResolvedValue(events);

    await expect(
      sevenTvService.fetchBridgedCosmetics(['cinna']),
    ).resolves.toEqual(events);
  });
});

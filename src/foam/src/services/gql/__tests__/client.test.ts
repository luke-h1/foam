import { sevenTvGqlApi } from '@app/services/api/clients';

import { sevenTvV4Client } from '../client';

jest.mock('@app/services/api/clients', () => ({
  sevenTvGqlApi: {
    post: jest.fn(),
  },
}));

const post = jest.mocked(sevenTvGqlApi.post);

describe('sevenTvV4Client.query', () => {
  beforeEach(() => {
    post.mockReset();
  });

  test('posts the query and variables to the GQL endpoint', async () => {
    post.mockResolvedValue({ data: { ok: true } });

    await sevenTvV4Client.query({
      query: 'query Foo { foo }',
      variables: { id: '123' },
    });

    expect(post).toHaveBeenCalledWith('/gql', {
      query: 'query Foo { foo }',
      variables: { id: '123' },
    });
  });

  test('returns parsed data on success', async () => {
    post.mockResolvedValue({ data: { value: 42 } });

    const result = await sevenTvV4Client.query<{ value: number }>({
      query: 'query Foo { value }',
    });

    expect(result).toEqual({ data: { value: 42 } });
  });

  test('surfaces GraphQL body errors alongside any partial data', async () => {
    post.mockResolvedValue({
      data: { value: null },
      errors: [{ message: 'bad field' }, { message: 'missing arg' }],
    });

    const result = await sevenTvV4Client.query<{ value: number | null }>({
      query: 'query Foo { value }',
    });

    expect(result).toEqual({
      data: { value: null },
      error: new Error('bad field; missing arg'),
    });
  });

  test('returns the thrown HTTP error as an error result', async () => {
    const httpError = new Error('SevenTVApiError');
    post.mockRejectedValue(httpError);

    const result = await sevenTvV4Client.query({
      query: 'query Foo { foo }',
    });

    expect(result).toEqual({ error: httpError });
  });
});

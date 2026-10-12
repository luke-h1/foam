import { sevenTvGqlApi } from '@app/services/api/clients';

import { type GraphQLResponse, sevenTvV4Client } from '../client';

const post = jest.spyOn(sevenTvGqlApi, 'post');

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

describe('sevenTvV4Client.queryDerived', () => {
  const postDerived = jest.spyOn(sevenTvGqlApi, 'postDerived');

  const doubleValue = (data: { value: number }) => {
    'worklet';

    return data.value * 2;
  };

  /**
   * Runs the client's real envelope worklet over the serialised body.
   */
  const respondWithBody = (body: GraphQLResponse<{ value: number } | null>) => {
    postDerived.mockImplementation((_path, _data, derive) =>
      Promise.resolve(derive(JSON.stringify(body))),
    );
  };

  beforeEach(() => {
    postDerived.mockReset();
  });

  test('posts the query and variables to the GQL endpoint', async () => {
    respondWithBody({ data: { value: 1 } });

    await sevenTvV4Client.queryDerived({
      query: 'query Foo { value }',
      variables: { id: '123' },
      derive: doubleValue,
    });

    expect(postDerived.mock.calls.map(([path, data]) => [path, data])).toEqual([
      ['/gql', { query: 'query Foo { value }', variables: { id: '123' } }],
    ]);
  });

  test('returns the derived data on success', async () => {
    respondWithBody({ data: { value: 21 } });

    const result = await sevenTvV4Client.queryDerived({
      query: 'query Foo { value }',
      derive: doubleValue,
    });

    expect(result).toEqual({ data: 42 });
  });

  test('returns GraphQL errors without deriving partial data', async () => {
    respondWithBody({
      data: null,
      errors: [{ message: 'bad field' }, { message: 'missing arg' }],
    });

    const result = await sevenTvV4Client.queryDerived({
      query: 'query Foo { value }',
      derive: doubleValue,
    });

    expect(result).toEqual({ error: new Error('bad field; missing arg') });
  });

  test('returns no data when the response has none', async () => {
    respondWithBody({ data: null });

    const result = await sevenTvV4Client.queryDerived({
      query: 'query Foo { value }',
      derive: doubleValue,
    });

    expect(result).toEqual({ data: undefined });
  });

  test('returns the thrown HTTP error as an error result', async () => {
    const httpError = new Error('SevenTVApiError');
    postDerived.mockRejectedValue(httpError);

    const result = await sevenTvV4Client.queryDerived({
      query: 'query Foo { value }',
      derive: doubleValue,
    });

    expect(result).toEqual({ error: httpError });
  });
});

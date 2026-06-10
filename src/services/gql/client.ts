const SEVEN_TV_GQL_URL = 'https://7tv.io/v4/gql';

interface QueryOptions<TVariables> {
  query: string;
  variables?: TVariables;
}

interface QueryResult<TData> {
  data?: TData;
  error?: Error;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: { message: string }[];
}

export const sevenTvV4Client = {
  async query<TData, TVariables = Record<string, never>>({
    query,
    variables,
  }: QueryOptions<TVariables>): Promise<QueryResult<TData>> {
    try {
      const response = await fetch(SEVEN_TV_GQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        return {
          error: new Error(`7TV GQL request failed: HTTP ${response.status}`),
        };
      }

      const result = (await response.json()) as GraphQLResponse<TData>;

      if (result.errors?.length) {
        return {
          data: result.data,
          error: new Error(result.errors.map(e => e.message).join('; ')),
        };
      }

      return { data: result.data };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

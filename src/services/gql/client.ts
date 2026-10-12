import { sevenTvGqlApi } from '@app/services/api/clients';

interface QueryOptions<TVariables> {
  query: string;
  variables?: TVariables;
}

interface DerivedQueryOptions<
  TVariables,
  TData,
  TResult,
> extends QueryOptions<TVariables> {
  /**
   * Maps the response `data` to the result. Runs on the background parse
   * runtime, so it must be a worklet.
   */
  derive: (data: TData) => TResult;
}

interface QueryResult<TData> {
  data?: TData;
  error?: Error;
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: { message: string }[];
}

interface DerivedResponse<TResult> {
  data?: TResult;
  errorMessage?: string;
}

export const sevenTvV4Client = {
  async query<TData, TVariables = Record<string, never>>({
    query,
    variables,
  }: QueryOptions<TVariables>): Promise<QueryResult<TData>> {
    try {
      const result = await sevenTvGqlApi.post<GraphQLResponse<TData>>('/gql', {
        query,
        variables,
      });

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

  /**
   * Like `query`, but the body is parsed and passed through `derive` on the
   * background parse runtime. Only the derived result crosses back to the JS
   * thread. A response with GraphQL errors returns the error and no data.
   */
  async queryDerived<TData, TResult, TVariables = Record<string, never>>({
    query,
    variables,
    derive,
  }: DerivedQueryOptions<TVariables, TData, TResult>): Promise<
    QueryResult<TResult>
  > {
    try {
      const result = await sevenTvGqlApi.postDerived(
        '/gql',
        { query, variables },
        (responseText): DerivedResponse<TResult> => {
          'worklet';

          const response: GraphQLResponse<TData | null> =
            JSON.parse(responseText);

          if (response.errors?.length) {
            return {
              errorMessage: response.errors.map(e => e.message).join('; '),
            };
          }

          return {
            data: response.data == null ? undefined : derive(response.data),
          };
        },
      );

      if (result.errorMessage !== undefined) {
        return { error: new Error(result.errorMessage) };
      }

      return { data: result.data };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

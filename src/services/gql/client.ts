import { sevenTvGqlApi } from '@app/services/api/clients';

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
};

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

export const sevenTvV4Client = new ApolloClient({
  link: new HttpLink({ uri: 'https://7tv.io/v4/gql' }),
  cache: new InMemoryCache(),
});

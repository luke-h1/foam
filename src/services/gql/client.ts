import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// seventv v4 GQL API
export const sevenTvV4Client = new ApolloClient({
  link: new HttpLink({ uri: 'https://7tv.io/v4/gql' }),
  cache: new InMemoryCache(),
});

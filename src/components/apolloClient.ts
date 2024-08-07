import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: 'https://2xvn4qei4rar5oflmwamp3xfwu.appsync-api.us-east-1.amazonaws.com/graphql',
  cache: new InMemoryCache(),
  headers: {
    "x-api-key": "da2-tu4ogqtm3be6xfexbcxf53mkhi",
  },
});

export default client;
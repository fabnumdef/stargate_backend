// @flow
import { ApolloServer } from 'apollo-server-koa';

import typeDefs from './schemas';
import resolvers from './resolvers';

// Configuration du serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true
});

export default server;

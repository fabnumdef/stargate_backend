import { HttpLink } from 'apollo-link-http';
import Koa from 'koa';
import { execute, toPromise } from 'apollo-link';

const { resolvers } = require('../src/resolvers');
const { typeDefs } = require('../src/schemas');

export const constructTestServer = ({ context = defaultContext } = {}) => {
  // TODO datasources
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context
  });
};

export const startTestServer = async server => {
  const app = new Koa();
  server.applyMiddleware({ app });
  const httpServer = await app.listen(0);

  const link = new HttpLink({
    uri: `http://localhost:${httpServer.port}`,
    fetch
  });

  const executeOperation = ({ query, variables = {} }) => execute(link, { query, variables });

  return {
    link,
    stop: () => httpServer.server.close(),
    graphql: executeOperation
  };
};

test.skip('Workaround', () => 1)
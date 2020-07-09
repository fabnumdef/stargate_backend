import { ApolloServer } from 'apollo-server-koa';
import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from 'graphql-tools';

import typeDefs from './schemas';
import resolvers from './resolvers';
import permissions from './models/permissions';

export const schema = applyMiddleware(
  makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  permissions,
);

const server = new ApolloServer({
  schema,
  playground: process.env.NODE_ENV === 'development',
  context: (req) => {
    /* istanbul ignore next */
    const context = {
      ...req.ctx,
      host: req.ctx.headers.host || 'localhost',
    };
    /* istanbul ignore next */
    if (req.ctx && req.ctx.state) {
      context.user = req.ctx.state.user;
    }
    /* istanbul ignore next */
    return context;
  },
});

export default server;

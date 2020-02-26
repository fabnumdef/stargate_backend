import { ApolloServer } from 'apollo-server-koa';
const { applyMiddleware } = require('graphql-middleware');
const { makeExecutableSchema } = require('graphql-tools');

import typeDefs from './schemas';
import resolvers from './resolvers';
import permissions from "./models/permissions";

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
      const context = {
          ...req.ctx,
      };
      if (req.ctx && req.ctx.state) {
          context.user = req.ctx.state.user;
      }
      return context;
    },
});

export default server;

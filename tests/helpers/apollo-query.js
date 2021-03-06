import { createTestClient } from 'apollo-server-testing';
import { ApolloServer } from 'apollo-server-koa';
import { schema } from '../../src/apollo-server';

export { gql } from 'apollo-server-koa';

export default (user) => createTestClient(new ApolloServer({
  schema,
  context: ({ ctx }) => ({ ...ctx, user, host: 'localhost' }),
}));

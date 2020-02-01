import { gql } from 'apollo-server-koa';

module.exports = gql`
  interface Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
  }
`;

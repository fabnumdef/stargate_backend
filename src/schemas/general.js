import { gql } from 'apollo-server-koa';

module.exports = gql`
  interface Node {
    id: ID!
    createdAt: Date!
    updatedAt: Date
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
  }
`;

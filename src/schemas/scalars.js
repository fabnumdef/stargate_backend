import { gql } from 'apollo-server-koa';

module.exports = gql`
  scalar DateTime
  scalar Email
  scalar Telephone
  scalar Postal
`;

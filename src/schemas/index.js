// @flow
import { gql } from 'apollo-server-koa';
import fs from 'fs';
import path from 'path';

const Schema = /* GraphQL */ gql`
  # The dummy queries and mutations are necessary because
  # graphql-js cannot have empty root types and we only extend
  # these types later on
  # Ref: apollographql/graphql-tools#293

  type Query {
    dummy: String
  }
  type Mutation {
    dummy: String
  }
  type Subscription {
    dummy: String
  }
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const schemas = [Schema];

const basename = path.basename(__filename);

// On recupere tout les models present dans le dossier actuel.
fs.readdirSync(__dirname)
  // On garde que les fichiers js excepter celui de conf du dossier.
  .filter(file => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach(file => {
    // On importe les resolvers dans la base
    let schema = require(`./${file}`);
    schemas.push(schema);
  });

export default schemas;

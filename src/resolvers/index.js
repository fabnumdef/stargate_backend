// @flow
import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';

let resolvers = {};
const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  // On garde que les fichiers js excepter celui de conf du dossier.
  .filter(file => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach(file => {
    // On importe les resolvers dans la base
    let resolver = require(`./${file}`);
    resolvers = merge(resolvers, resolver);
  });
// On recupere tout les models present dans le dossier actuel.

export default resolvers;

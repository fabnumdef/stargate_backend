/* eslint-disable import/no-dynamic-require,global-require */
import path from 'path';

const { readSync, CASELESS_SORT } = require('readdir');

export default readSync(__dirname, ['**.js'], CASELESS_SORT)
  .filter((f) => f !== path.basename(__filename))
  .map((fileName) => require(path.join(__dirname, fileName)));

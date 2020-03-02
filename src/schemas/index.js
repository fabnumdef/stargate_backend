import fs from 'fs';
import path from 'path';

const { readSync, CASELESS_SORT } = require('readdir');

export default readSync(__dirname, ['**.graphqls'], CASELESS_SORT)
  .map((fileName) => fs.readFileSync(path.join(__dirname, fileName)).toString());

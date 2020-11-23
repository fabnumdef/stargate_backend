import fs from 'fs';
import path from 'path';

const { readSync, CASELESS_SORT } = require('readdir');

export default readSync(__dirname, ['**.graphqls'], CASELESS_SORT)
// eslint-disable-next-line security/detect-non-literal-fs-filename
  .map((fileName) => fs.readFileSync(path.join(__dirname, fileName)).toString());

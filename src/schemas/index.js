const { readSync, CASELESS_SORT } = require('readdir');
import fs from 'fs';
import path from 'path';

export default readSync(__dirname, ['**.graphqls'], CASELESS_SORT)
    .map((fileName) => {
        return fs.readFileSync(path.join(__dirname, fileName)).toString();
    });


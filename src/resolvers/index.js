const { readSync, CASELESS_SORT } = require('readdir');
import fs from 'fs';
import path from 'path';

export default readSync(__dirname, ['**.js'], CASELESS_SORT)
    .filter(f => f !== path.basename(__filename))
    .map((fileName) => {
        return require(path.join(__dirname, fileName));
    });


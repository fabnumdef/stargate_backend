/* eslint-disable global-require,
import/no-dynamic-require,
security/detect-non-literal-fs-filename,
security/detect-non-literal-require */
import util from 'util';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import services from './services';

const { promisify } = util;
const readDir = promisify(fs.readdir);

const FILENAME = typeof __filename !== 'undefined' ? __filename
  : (/^ +at (?:file:\/*(?=\/)|)(.*?):\d+:\d+$/m.exec(Error().stack) || '')[1];
const DIRNAME = typeof __dirname !== 'undefined' ? __dirname
  : FILENAME.replace(/[/\\][^/\\]*?$/, '');

(async () => {
  await services;

  await Promise.all((await readDir(path.join(DIRNAME, 'models')))
    .filter((fileName) => fileName.endsWith('.js'))
    .filter((fileName) => !['permissions.js', 'rules.js'].includes(fileName))
    .map(async (fileName) => {
      const { default: Model } = require(path.join(DIRNAME, 'models', fileName));
      await Model.syncIndexes();
      process.stdout.write(`Indexes of "${Model.modelName}" has been updated \n`);
    }));
  await mongoose.connection.close();
})();

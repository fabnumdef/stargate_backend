/* eslint-disable global-require,
import/no-dynamic-require,
security/detect-non-literal-fs-filename,
security/detect-non-literal-require */
import pino from 'pino';
import mongoose from 'mongoose';
import util from 'util';
import fs from 'fs';
import path from 'path';
import config from '../src/services/config';
import MongooseService from '../src/services/mongoose';

const { promisify } = util;
const readDir = promisify(fs.readdir);
const log = pino();

const FILENAME = typeof __filename !== 'undefined' ? __filename
  : (/^ +at (?:file:\/*(?=\/)|)(.*?):\d+:\d+$/m.exec(Error().stack) || '')[1];
const DIRNAME = typeof __dirname !== 'undefined' ? __dirname
  : FILENAME.replace(/[/\\][^/\\]*?$/, '');

(async () => {
  const hrstart = process.hrtime();
  await MongooseService(config.get('mongodb'));
  try {
    await Promise.all((await readDir(path.join(DIRNAME, '../src/models')))
      .filter((fileName) => fileName.endsWith('.js'))
      .filter((fileName) => !['permissions.js', 'rules.js'].includes(fileName))
      .map(async (fileName) => {
        const { default: Model } = require(path.join(DIRNAME, '../src/models', fileName));
        try {
          await mongoose.connection.db.dropCollection(Model.collection.name);
          log.info(`Collection "${Model.collection.name}" has been dropped`);
        } catch (e) {
          log.error(`Collection "${Model.collection.name}" has _not_ been dropped`);
        }
      }));
  } finally {
    await mongoose.connection.close();
  }
  const hrend = process.hrtime(hrstart);
  log.info(`Database cleared in ${hrend[0]}s ${hrend[1] / 1000000}ms`);
})();

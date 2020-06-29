import mongoose from 'mongoose';
import path from 'path';
import util from 'util';
import fs from 'fs';
import MongooseService from '../src/services/mongoose';
import config from '../src/services/config';

const { promisify } = util;
const readDir = promisify(fs.readdir);
beforeAll(async () => {
  config.set('mail:transporter:host', '');
  config.set('mail:transporter:auth', null);
  const DATABASE = `${config.get('mongodb')}-test`;
  await MongooseService(DATABASE, { retryWrites: false });
  await mongoose.connection.db.dropDatabase();

  await Promise.all((await readDir(path.join(__dirname, '../src/models')))
    .filter((fileName) => fileName.endsWith('.js'))
    .filter((fileName) => !['permissions.js', 'rules.js'].includes(fileName))
    .map(async (fileName) => {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      const { default: Model } = require(path.join(__dirname, '../src/models', fileName));
      await Model.syncIndexes();
    }));
});

afterAll(async () => {
  await mongoose.disconnect();
});

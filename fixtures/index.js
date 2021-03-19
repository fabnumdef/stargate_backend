/* eslint-disable global-require,
import/no-dynamic-require,
security/detect-non-literal-fs-filename,
security/detect-non-literal-require */
import path from 'path';
import util from 'util';
import fs from 'fs';
import pino from 'pino';
import mongoose from 'mongoose';
import MongooseService from '../src/services/mongoose';
import config from '../src/services/config';

import {
  REQUEST01_ID,
} from './datarequest/request';
import RequestModel from '../src/models/request';

const log = pino();
const { promisify } = util;
const readDir = promisify(fs.readdir);
const MODELS_DIR = path.resolve(__dirname, '..', 'src', 'models');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR_REQ = path.join(__dirname, 'datarequest');

(async () => {
  const hrstart = process.hrtime();
  await MongooseService(config.get('mongodb'));
  const files = await readDir(DATA_DIR);
  const filesReq = await readDir(DATA_DIR_REQ);

  try {
    const JSON_EXT = '.json';
    await Promise.all(files.filter((f) => f.endsWith(JSON_EXT)).map(async (filename) => {
      const { default: Model } = require(path.join(MODELS_DIR, path.basename(filename, JSON_EXT)));
      const data = require(path.join(DATA_DIR, filename));
      return Promise.all(data.map((d) => Model.create(d)));
    }));

    const JS_EXT = '.js';
    await Promise.all(files.filter((f) => f.endsWith(JS_EXT)).map(async (filename) => {
      const { default: Model } = require(path.join(MODELS_DIR, path.basename(filename, JS_EXT)));
      const { default: factory } = require(path.join(DATA_DIR, filename));
      const data = await factory({ log, config });
      return Promise.all(data.map((d) => Model.create(d)));
    }));

    await Promise.all(filesReq.filter((f) => f.endsWith(JS_EXT)).map(async (filename) => {
      const { default: Model } = require(path.join(MODELS_DIR, path.basename(filename, JS_EXT)));
      const { default: factory } = require(path.join(DATA_DIR_REQ, filename));
      const data = await factory({ log, config });
      return Promise.all(data.map((d) => Model.create(d)));
    }));

    try {
      const shiftRequest = await RequestModel.findById(REQUEST01_ID);
      await shiftRequest.stateMutation('CREATE');
      await shiftRequest.save();
      // console.log(shiftRequest);
    } catch (error) {
      log.error(error);
    } finally {
      log.info('Request transition moved from Drafted to Created!');
    }
  } finally {
    await mongoose.connection.close();
  }

  const hrend = process.hrtime(hrstart);
  log.info(`Fixtures injected in ${hrend[0]}s ${hrend[1] / 1000000}ms`);
})();

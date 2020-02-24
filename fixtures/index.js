import path from "path";
import util from 'util';
import fs from 'fs';
import pino from 'pino';
import mongoose from 'mongoose';
import MongooseService from '../src/services/mongoose';
import config from '../src/services/config';

const log = pino();
const { promisify } = util;
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const MODELS_DIR = path.resolve(__dirname, '..', 'src', 'models');
const DATA_DIR = path.join(__dirname, 'data');

(async () => {
    const hrstart = process.hrtime();
    await MongooseService(config.get('mongodb'));
    const files = await readDir(DATA_DIR);

    try {
        const JSON_EXT = '.json';
        await Promise.all(files.filter(f => f.endsWith(JSON_EXT)).map(async (filename) => {
            const {default: Model} = require(path.join(MODELS_DIR, path.basename(filename, JSON_EXT)));
            const data = require(path.join(DATA_DIR, filename));
            return Model.insertMany(data);
        }));

        const JS_EXT = '.js';
        await Promise.all(files.filter(f => f.endsWith(JS_EXT)).map(async (filename) => {
            const {default: Model} = require(path.join(MODELS_DIR, path.basename(filename, JS_EXT)));
            const {default: factory} = require(path.join(DATA_DIR, filename));
            const data = await factory ({ log, config });
            return Model.insertMany(data);
        }));
    } finally {
        await mongoose.connection.close();
    }

    const hrend = process.hrtime(hrstart);
    log.info(`Fixtures injected in ${hrend[0]}s ${hrend[1] / 1000000}ms`);
})();

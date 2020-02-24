import pino from 'pino';
import mongoose from 'mongoose';
import MongooseService from '../src/services/mongoose';
import config from '../src/services/config';

const log = pino();

(async () => {
    const hrstart = process.hrtime();
    await MongooseService(config.get('mongodb'));
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    const hrend = process.hrtime(hrstart);
    log.info(`Database cleared in ${hrend[0]}s ${hrend[1] / 1000000}ms`);
})();

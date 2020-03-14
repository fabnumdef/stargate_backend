import config from '../../src/services/config';
import MongooseService from '../../src/services/mongoose';

const DATABASE = `${config.get('mongodb')}-test`;

MongooseService(DATABASE, { retryWrites: false });

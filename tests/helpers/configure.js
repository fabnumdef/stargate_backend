import config from '../../src/services/config';
import MongooseService from '../../src/services/mongoose';

config.get('mail:whitelist_domains').push('localhost');
const DATABASE = `${config.get('mongodb')}-test`;

MongooseService(DATABASE, { retryWrites: false });

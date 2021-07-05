import config from './config';
import MongooseService from './mongoose';
import OpenIDService from './openid';

export default Promise.all([
  OpenIDService(config.get('openid')),
  MongooseService(config.get('mongodb')),
]);

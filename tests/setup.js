import mongoose from 'mongoose';
import config from '../src/services/config';
import MongooseService from '../src/services/mongoose';

beforeAll(async () => {
  config.set('mail:transporter:host', '');
  config.set('mail:transporter:auth', null);
  const DATABASE = `${config.get('mongodb')}-test`;
  await MongooseService(DATABASE, { retryWrites: false });
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

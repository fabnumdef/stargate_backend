import mongoose from 'mongoose';
import config from '../src/services/config';
import MongooseService from '../src/services/mongoose';

beforeAll(async () => {
  const DATABASE = `${config.get('mongodb')}-test`;
  await MongooseService(DATABASE, { retryWrites: false });
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import pino from 'pino';
import graphqlProjection from '../models/helpers/graphql-projection';

const log = pino();
mongoose.plugin(updateIfCurrentPlugin);
mongoose.plugin(graphqlProjection);

const connect = async (config) => {
  try {
    const deprecationOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    };
    await mongoose.connect(config, deprecationOptions);
    log.info('MongoDB connected !');
  } catch (e) {
    log.error(`MongoDB connect failed (${config}), retry in 10 seconds`, e);
    await new Promise((accept) => {
      setTimeout(accept, 10000);
    });
    await connect(config);
  }
};
export default connect;

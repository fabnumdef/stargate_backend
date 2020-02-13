import mongoose from 'mongoose';
import pino from 'pino';

const log = pino();

const connect = async (config) => {
  try {
    const deprecationOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    };
    await mongoose.connect(config, deprecationOptions);
    log.info('MongoDB connected !');
  } catch (e) {
    log.error('MongoDB connect failed, retry in 10 seconds');
    await new Promise((accept) => {
      setTimeout(accept, 10000);
    });
    await connect(config);
  }
};
export default connect;

import Koa from 'koa';
import compression from 'koa-compress';
import helmet from 'koa-helmet';
import jwt from 'koa-jwt';
import koaBody from 'koa-body';
import { graphqlUploadKoa } from 'graphql-upload';
import apolloServer from './apollo-server';
import config from './services/config';
import routes from './routes';
import metricsMiddleware from './middlewares/metrics';
import errorHandler from './middlewares/errors';

const pino = require('koa-pino-logger')();

const exporterPort = config.get('prometheus_exporter');

const app = new Koa();
app.use(helmet());
app.silent = true;
if (exporterPort) {
  app.use(metricsMiddleware);
}
app.use(errorHandler);
app.use(pino);
app.use(compression());
app.use(jwt({ secret: config.get('token:secret'), passthrough: true }));
app.use(routes);
app.use(koaBody());
app.use(graphqlUploadKoa({ maxFileSize: 1024 * 1024, maxFiles: 10 }));
apolloServer.applyMiddleware({ app, path: '/api' });

export default app;

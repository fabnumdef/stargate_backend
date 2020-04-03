// @flow
import Koa from 'koa';
import compression from 'koa-compress';
import jwt from 'koa-jwt';
import koaBody from 'koa-body';
import apolloServer from './apollo-server';
import config from './services/config';
import routes from './routes';
import metricsMiddleware from './middlewares/metrics';

const pino = require('koa-pino-logger')();

const exporterPort = config.get('prometheus_exporter');


const app = new Koa();
app.silent = true;
if (exporterPort) {
  app.use(metricsMiddleware);
}
app.use(pino);
app.use(compression());
app.use(jwt({ secret: config.get('token:secret'), passthrough: true }));
app.use(routes);
app.use(koaBody());
apolloServer.applyMiddleware({ app, path: '/api' });

export default app;

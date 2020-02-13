// @flow
import Koa from 'koa';
import compression from 'koa-compress';
import apolloServer from './apollo-server';
import config from './services/config';
import routes from './routes';
const pino = require('koa-pino-logger')();
import metricsMiddleware from './middlewares/metrics';

const exporterPort = config.get('prometheus_exporter');


const app = new Koa();
app.silent = true;
if (exporterPort) {
    app.use(metricsMiddleware);
}
app.use(pino);
app.use(compression());
app.use(routes);

apolloServer.applyMiddleware({ app, path: '/api' });

export default app;
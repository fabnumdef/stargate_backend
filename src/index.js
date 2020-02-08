// @flow
const debug = require('debug')('api');
debug('Server starting...');
debug('logging with debug enabled!');

require('dotenv').config();
import Koa from 'koa';
import http from 'http';
import compression from 'koa-compress';
import Prometheus from 'prom-client';
import apolloServer from './apollo-server';
import routes from './routes';
import metricsMiddleware from './middlewares/metrics';

const port = process.env.PORT || 3000;

const metricsInterval = Prometheus.collectDefaultMetrics();

process.on('SIGTERM', () => {
    clearInterval(metricsInterval);
});

const app = new Koa();
app.use(metricsMiddleware);
app.use(compression());
app.use(routes);

apolloServer.applyMiddleware({ app, path: '/api' });

app.listen(port);

debug(`GraphQL API running at http://localhost:${port}/api`);

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': Prometheus.register.contentType });
    res.end(Prometheus.register.metrics());
}).listen(process.env.PROMETHEUS_PORT || 9091, '0.0.0.0');

debug(`Prometheus exporter running at http://localhost:${process.env.PROMETHEUS_PORT}`);

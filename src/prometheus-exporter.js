import Prometheus from 'prom-client';
import http from 'http';
import pino from 'pino';
import config from './services/config';

const log = pino();

export default (port) => {
  const metricsInterval = Prometheus.collectDefaultMetrics();

  process.on('SIGTERM', () => {
    clearInterval(metricsInterval);
  });

  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': Prometheus.register.contentType });
    res.end(Prometheus.register.metrics());
  }).listen(port, config.get('host'));
  log.info(`Prometheus exporter listening on port ${port}`);
};

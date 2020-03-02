import pino from 'pino';
import services from './services';
import app from './app';
import prometheusExporter from './prometheus-exporter';
import config from './services/config';

const log = pino();

(async () => {
  await services;
  const port = config.get('port');
  const exporterPort = config.get('prometheus_exporter');
  if (exporterPort) {
    prometheusExporter(exporterPort);
  }
  app.listen(port);
  log.info(`Koa listening on port ${port}`);
})();

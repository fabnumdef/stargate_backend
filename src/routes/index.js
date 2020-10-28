import Router from '@koa/router';
import config from '../services/config';
import downloadRoute from './download';
import exportRoute from './export';

const router = new Router();

// Used for liveness & readyness probes
router.get('/', async (ctx) => {
  ctx.body = `OK - ${config.get('version')}`;
});

router.use(downloadRoute.allowedMethods());
router.use(exportRoute.allowedMethods());
router.use(downloadRoute.routes());
router.use(exportRoute.routes());

export default router.routes();

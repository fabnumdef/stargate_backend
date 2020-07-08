import Router from '@koa/router';
import config from '../services/config';
import downloadRoute from './download';

const router = new Router();

// Used for liveness & readyness probes
router.get('/', async (ctx) => {
  ctx.body = `OK - ${config.get('version')}`;
});

router.use(downloadRoute.allowedMethods());
router.use(downloadRoute.routes());

export default router.routes();

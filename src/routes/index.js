import Router from '@koa/router';
import config from '../services/config';

const router = new Router();

// Used for liveness & readyness probes
router.get('/', async (ctx) => {
  ctx.body = `OK - ${config.get('version')}`;
});

export default router.routes();

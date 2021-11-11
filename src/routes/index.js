import Router from '@koa/router';
import packageJSON from '../../package.json';
import downloadRoute from './download';
import exportRoute from './export';

const router = new Router();

// Used for liveness & readyness probes
router.get('/', async (ctx) => {
  ctx.body = `OK - ${packageJSON.version}`;
});

router.use(downloadRoute.allowedMethods());
router.use(exportRoute.allowedMethods());
router.use(downloadRoute.routes());
router.use(exportRoute.routes());

export default router.routes();

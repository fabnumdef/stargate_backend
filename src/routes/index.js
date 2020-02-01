import Router from '@koa/router';
const router = new Router();

// Used for liveness & readyness probes
router.get('/', async (ctx) => {
    ctx.body = 'OK';
});

export default router.routes();
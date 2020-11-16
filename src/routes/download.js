import Router from '@koa/router';
import DownloadToken from '../models/download-token';
import { APIError } from '../models/helpers/errors';
import { downloadFile } from '../models/helpers/upload';

const router = new Router();

router.get('/download/:export_token', async (ctx) => {
  const downloadToken = await DownloadToken.findById(ctx.params.export_token);
  if (!downloadToken) {
    throw new APIError(404, 'Token not found');
  }
  try {
    const options = downloadToken.options.file;
    const file = await downloadFile(options);
    ctx.set('Content-Type', file.data.contentType);
    ctx.set(
      'Content-Disposition',
      `attachment; filename="${file.data.filename}"`,
    );
    ctx.body = file.stream;
  } catch (e) {
    throw new APIError(500, 'Download format not supported');
  }
});

export default router;

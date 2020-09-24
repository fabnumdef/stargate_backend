import Router from '@koa/router';
import mongoose from 'mongoose';
import Json2csv from 'json2csv';
import ExportToken, { EXPORT_FORMAT_CSV } from '../models/export-token';
import { APIError } from '../models/helpers/errors';

const { transforms: { flatten } } = Json2csv;
const router = new Router();

router.get('/download/:export_token', async (ctx) => {
  const exportToken = await ExportToken.findById(ctx.params.export_token);
  if (!exportToken) {
    throw new APIError(404, 'Token not found');
  }
  const Model = exportToken.modelName ? mongoose.model(exportToken.modelName) : null;
  const list = Model ? await Model.find(exportToken.filters, exportToken.projection).lean() : {};
  switch (exportToken.format) {
    case EXPORT_FORMAT_CSV:
      {
        const options = exportToken.options.csv;
        const parser = new Json2csv.Parser({
          fields: options.fields,
          transforms: [flatten()],
          quote: options.quote,
          delimiter: options.separator,
          encoding: options.encoding,
        });
        ctx.type = 'text/csv';
        ctx.set('Content-Disposition', `attachment; filename="${exportToken._id}.csv"`);
        ctx.body = parser.parse(list);
      }
      break;
    default:
      throw new APIError(500, 'Export format not supported');
  }
});

export default router;

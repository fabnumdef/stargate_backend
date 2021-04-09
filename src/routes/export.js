import Router from '@koa/router';
import mongoose from 'mongoose';
import Json2csv from 'json2csv';
import ExportToken, { EXPORT_FORMAT_CSV } from '../models/export-token';
import { CONVERT_TYPE_IMPORT_CSV, CONVERT_STATE_VISITOR_CSV } from '../models/visitor';

import { APIError } from '../models/helpers/errors';

const { transforms: { flatten } } = Json2csv;
const router = new Router();

router.get('/export/:export_token', async (ctx) => {
  const exportToken = await ExportToken.findById(ctx.params.export_token);
  if (!exportToken) {
    throw new APIError(404, 'Token not found');
  }
  const Model = exportToken.modelName ? mongoose.model(exportToken.modelName) : null;
  const list = Model ? await Model.find(exportToken.filters, exportToken.projection).lean() : [];
  if (exportToken.modelName === 'Visitor') {
    list.map((item) => {
      const newItem = Object.assign(item);
      newItem.request.from = item.request.from.toLocaleString('fr-FR');
      newItem.request.to = item.request.to.toLocaleString('fr-FR');
      newItem.birthday = item.birthday.toLocaleString('fr-FR');
      newItem.createdAt = item.createdAt.toLocaleString('fr-FR');
      newItem.updatedAt = item.updatedAt.toLocaleString('fr-FR');
      newItem.isInternal = item.isInternal ? 'MINARM' : 'EXTERIEUR';
      newItem.nationality = item.nationality.toUpperCase();
      newItem.employeeType = CONVERT_TYPE_IMPORT_CSV[item.employeeType].toUpperCase();
      newItem.status = CONVERT_STATE_VISITOR_CSV[item.status].toUpperCase();
      return newItem;
    });
  }
  switch (exportToken.format) {
    case EXPORT_FORMAT_CSV:
      {
        if (exportToken.persistDate) {
          await Promise.all(list.map(async (item) => Model.update({ _id: item._id }, { exportDate: new Date() })));
        }
        const options = exportToken.options.csv;
        const parser = new Json2csv.Parser({
          transforms: [flatten()],
          fields: options.fields,
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

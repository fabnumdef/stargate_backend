import Router from '@koa/router';
import mongoose from 'mongoose';
import Json2csv from 'json2csv';
import { DateTime } from 'luxon';
import ExportToken, { EXPORT_FORMAT_CSV } from '../models/export-token';
import { CONVERT_TYPE_IMPORT_CSV, CONVERT_STATE_VISITOR_CSV } from '../models/visitor';
import { ROLE_SECURITY_OFFICER, ROLE_SCREENING } from '../models/rules';

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
  const listFinal = [];
  if (exportToken.modelName === 'Visitor') {
    list.map((item) => {
      // add some property that does not exist in Visitor or not directly
      const newItem = {
        ...Object.assign(item),
        dateScreening: '',
        typeBadge: '',
        emptyField: '',
      };
      newItem.request.from = DateTime.fromJSDate(item.request.from).toFormat('dd/LL/yyyy');
      newItem.request.to = DateTime.fromJSDate(item.request.to).toFormat('dd/LL/yyyy');
      newItem.birthday = DateTime.fromJSDate(item.birthday).toFormat('dd/LL/yyyy');

      // get step of SECURITY_OFFICER and SCREENING
      const unit = item.request.units[0];
      if (typeof (unit) !== 'undefined') {
        const stepSO = unit.workflow.steps.find((s) => s.role === ROLE_SECURITY_OFFICER);
        const stepGend = unit.workflow.steps.find((s) => s.role === ROLE_SCREENING);
        newItem.typeBadge = stepSO.state.payload.tags.join('\r');
        newItem.dateScreening = DateTime.fromJSDate(stepGend.state.date).toFormat('LL/yyyy');
      } else {
        newItem.typeBadge = 'INDEFINI';
        newItem.dateScreening = 'INDEFINI';
      }

      newItem.isInternal = item.isInternal ? 'MINARM' : 'EXTERIEUR';
      newItem.nationality = item.nationality.toUpperCase();
      newItem.employeeType = typeof (CONVERT_TYPE_IMPORT_CSV[item.employeeType]) !== 'undefined'
        ? CONVERT_TYPE_IMPORT_CSV[item.employeeType].toUpperCase()
        : 'INDEFINI';
      newItem.status = typeof (CONVERT_STATE_VISITOR_CSV[item.status]) !== 'undefined'
        ? CONVERT_STATE_VISITOR_CSV[item.status].toUpperCase()
        : 'INDEFINI';

      listFinal.push(newItem);
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
        const fieldToBeRemoved = { label: 'UNITES', value: 'request.units' };
        const fieldToBeAdded1 = { label: 'SERVICE', value: 'emptyField' };
        const fieldToBeAdded2 = { label: 'PAYS DE NAISSANCE', value: 'emptyfield' };
        const fieldToBeAdded3 = { label: 'DATE CRIBLAGE', value: 'dateScreening' };
        const fieldToBeAdded4 = { label: 'TYPE DE BADGE', value: 'typeBadge' };
        const fieldToBeAdded5 = { label: 'NOM PERSONNE VISITEE', value: 'emptyfield' };
        const fieldToBeAdded6 = { label: 'PRENOM PERSONNE VISITEE', value: 'emptyfield' };
        // remove field
        options.fields.splice(options.fields.findIndex((a) => a.value === fieldToBeRemoved.value), 1);
        // insert fields that does not exist in Visitor
        options.fields.splice(options.fields.findIndex((a) => a.label === 'DATE DEBUT VALIDITE'), 0, fieldToBeAdded1);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'LIEU DE TRAVAIL'), 0, fieldToBeAdded2);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded3);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded4);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded5);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded6);

        const parser = new Json2csv.Parser({
          transforms: [flatten()],
          fields: options.fields,
          quote: options.quote,
          delimiter: options.separator,
          encoding: options.encoding,
        });
        ctx.type = 'text/csv';
        ctx.set('Content-Disposition', `attachment; filename="${exportToken._id}.csv"`);
        ctx.body = parser.parse(listFinal);
      }
      break;
    default:
      throw new APIError(500, 'Export format not supported');
  }
});

export default router;

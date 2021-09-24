import Router from '@koa/router';
import mongoose from 'mongoose';
import Json2csv from 'json2csv';
import { DateTime } from 'luxon';
import Excel from 'exceljs';
import { isUndefined } from 'lodash';
import ExportToken, { EXPORT_FORMAT_CSV, EXPORT_FORMAT_XLSX } from '../models/export-token';
import { CONVERT_TYPE_IMPORT_XLSX, CONVERT_STATE_VISITOR_CSV } from '../models/visitor';
import { ROLE_ACCESS_OFFICE, ROLE_SCREENING } from '../models/rules';

import { APIError } from '../models/helpers/errors';

const XLSX_COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_XLSX_LINE = 100;

const { transforms: { flatten } } = Json2csv;
const router = new Router();

router.get('/export/:export_token', async (ctx) => {
  const exportToken = await ExportToken.findById(ctx.params.export_token);
  function noAccentedChar(str) {
    if (str !== null && str !== isUndefined) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return '';
  }
  if (!exportToken) {
    throw new APIError(404, 'Token not found');
  }
  const Model = exportToken.modelName ? mongoose.model(exportToken.modelName) : null;
  const list = Model ? await Model.find(exportToken.filters, exportToken.projection).lean() : [];
  let fileName = '';
  let listFinal = [];
  if (exportToken.modelName === 'Visitor') {
    // filters changed to function with aggregate
    const filtersMod = {
      'request.units': exportToken.filters['request.units'],
      'request._id': { $in: exportToken.filters['request._id'] },
      'request.campus._id': exportToken.filters['request.campus._id'],
    };

    let listAgreg;
    if (typeof (exportToken.filters['request._id']) === 'object') {
      listAgreg = await Model.aggregate()
        .match(filtersMod)
        .project(exportToken.projection)
        .addFields(exportToken.projformat);
    } else {
      listAgreg = list;
    }

    listAgreg.map((item) => {
      // add some property that does not exist in Visitor or not directly
      const newItem = {
        ...Object.assign(item),
        dateScreening: '',
        typeBadge: '',
      };
      // get step of ACCESS_OFFICE for searching validation tags and SCREENING
      // get step of SCREENING     for searching date screening
      item.request.units.find((unit) => {
        if (typeof (unit) !== 'undefined') {
          const stepSO = unit.workflow.steps.find((s) => s.role === ROLE_ACCESS_OFFICE);
          const stepGend = unit.workflow.steps.find((s) => s.role === ROLE_SCREENING);
          newItem.typeBadge = stepSO.state.payload.tags.join('\r');
          newItem.dateScreening = DateTime.fromJSDate(stepGend.state.date).toFormat('LL/yyyy');
        } else {
          newItem.typeBadge = 'INDEFINI';
          newItem.dateScreening = 'INDEFINI';
        }
        return newItem;
      });

      newItem.isInternal = item.isInternal ? 'MINARM' : 'EXTERIEUR';
      newItem.nationality = noAccentedChar(item.nationality).toUpperCase();
      newItem.employeeType = typeof (CONVERT_TYPE_IMPORT_XLSX[item.employeeType]) !== 'undefined'
        ? noAccentedChar(CONVERT_TYPE_IMPORT_XLSX[item.employeeType]).toUpperCase()
        : 'INDEFINI';
      newItem.status = typeof (CONVERT_STATE_VISITOR_CSV[item.status]) !== 'undefined'
        ? noAccentedChar(CONVERT_STATE_VISITOR_CSV[item.status]).toUpperCase()
        : 'INDEFINI';
      newItem.request.from = DateTime.fromJSDate(item.request.from).toFormat('dd/LL/yyyy').concat(' 07h00');
      newItem.request.to = DateTime.fromJSDate(item.request.to).toFormat('dd/LL/yyyy').concat(' 19h00');
      newItem.birthday = DateTime.fromJSDate(item.birthday).toFormat('dd/LL/yyyy');

      newItem.birthLastname = noAccentedChar(item.birthLastname).toUpperCase();
      newItem.usageLastname = noAccentedChar(item.usageLastname).toUpperCase();
      newItem.firstname = noAccentedChar(item.firstname).toUpperCase();
      newItem.birthplace = noAccentedChar(item.birthplace).toUpperCase();
      newItem.company = noAccentedChar(item.company).toUpperCase();
      newItem.employeeType = noAccentedChar(item.employeeType).toUpperCase();
      newItem.typeBadge = noAccentedChar(newItem.typeBadge).toUpperCase();

      listFinal.push(newItem);
      return newItem;
    });
    // remove field
    const fieldToBeRemoved = { label: 'UNITES', value: 'request.units' };
    const options = exportToken.options.csv;
    options.fields.splice(options.fields.findIndex((a) => a.value === fieldToBeRemoved.value), 1);
    const dateExport = DateTime.fromJSDate(new Date()).toFormat('yyyyLLddhhmm');
    fileName = `EXPORT_CSV_STARGATE_${dateExport}`;
  } else {
    listFinal = list;
    fileName = exportToken._id;
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
        ctx.set('Content-Disposition', `attachment; filename=${fileName}.csv`);
        ctx.body = parser.parse(listFinal);
      }
      break;
    case EXPORT_FORMAT_XLSX:
      {
        const workbook = new Excel.Workbook();
        const sheet = workbook.addWorksheet('XLSX_EXPORT');
        sheet.columns = exportToken.options.xlsx.fields.map((field, index) => {
          if (field.enum) {
            const columnLetter = XLSX_COLUMN_LETTERS.split('')[index];
            sheet.dataValidations.add(`${columnLetter}2:${columnLetter}${MAX_XLSX_LINE}`, {
              type: 'list',
              allowBlank: true,
              formulae: [`"${field.enum}"`],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Error',
              error: 'Value must be in the list',
            });
          }
          return {
            ...field,
            width: field.header.length < 15 ? 15 : field.header.length + 5,
          };
        });

        ctx.response.attachment(`${exportToken._id}.xlsx`);
        ctx.status = 200;
        await workbook.xlsx.write(ctx.res);
        ctx.res.end();
      }
      break;
    default:
      throw new APIError(500, 'Export format not supported');
  }
});

export default router;

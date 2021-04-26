import Router from '@koa/router';
import mongoose from 'mongoose';
import Json2csv from 'json2csv';
import { DateTime } from 'luxon';
import ExportToken, { EXPORT_FORMAT_CSV } from '../models/export-token';
import { CONVERT_TYPE_IMPORT_CSV, CONVERT_STATE_VISITOR_CSV } from '../models/visitor';
import { ROLE_ACCESS_OFFICE, ROLE_SCREENING } from '../models/rules';

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

      // get step of ACCESS_OFFICE for searching validation tags and SCREENING
      // get step of SCREENING     for searching date screening
      const unit = item.request.units[0];
      if (typeof (unit) !== 'undefined') {
        const stepSO = unit.workflow.steps.find((s) => s.role === ROLE_ACCESS_OFFICE);
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

        // remove field
        const fieldToBeRemoved = { label: 'UNITES', value: 'request.units' };
        options.fields.splice(options.fields.findIndex((a) => a.value === fieldToBeRemoved.value), 1);

        // insert fields that does not exist in Visitor
        const fieldToBeAdded1 = { label: 'NOM ET EXTENSION PHOTO', value: 'emptyField' };
        const fieldToBeAdded2 = {
          label: 'Adresse mail du responsable "Accès" unité/entreprise OBLIGATOIRE',
          value: 'emptyField',
        };
        const fieldToBeAdded3 = { label: 'CIVILITE', value: 'emptyField' };
        const fieldToBeAdded4 = { label: 'SERVICE', value: 'emptyField' };
        const fieldToBeAdded5 = { label: 'VALIDITE ACCES', value: 'emptyField' };
        const fieldToBeAdded6 = { label: 'PAYS DE NAISSANCE', value: 'emptyfield' };
        const fieldToBeAdded7 = { label: 'LIEU(X) DE TRAVAIL', value: 'emptyfield' };
        const fieldToBeAdded8 = { label: 'DATE CRIBLAGE', value: 'dateScreening' };
        const fieldToBeAdded9 = { label: 'ACCES HOMET', value: 'emptyfield' };
        const fieldToBeAdded10 = { label: 'ACCES CACHIN', value: 'emptyfield' };
        const fieldToBeAdded11 = { label: 'ACCES COMNORD', value: 'emptyfield' };
        const fieldToBeAdded12 = { label: 'ACCES NARDOUET', value: 'emptyfield' };
        const fieldToBeAdded13 = { label: 'ACCES ILOT SUD', value: 'emptyfield' };
        const fieldToBeAdded14 = { label: 'ACCES H3', value: 'emptyfield' };
        const fieldToBeAdded15 = { label: 'ADRESSE MAIL UNITE CONTRACTANTE', value: 'emptyfield' };
        const fieldToBeAdded16 = { label: 'DROIT DE CONDUITE', value: 'emptyfield' };
        const fieldToBeAdded17 = { label: 'PROFIL D\'ACCES', value: 'emptyfield' };
        const fieldToBeAdded18 = { label: 'COMMENTAIRE', value: 'emptyfield' };
        const fieldToBeAdded19 = { label: 'FREQUENCE DE VISITE', value: 'emptyfield' };
        const fieldToBeAdded20 = { label: 'ENVOI MAIL', value: 'emptyfield' };
        const fieldToBeAdded21 = { label: 'IMPORTATION PROTECTER', value: 'emptyfield' };
        const fieldToBeAdded22 = { label: 'REFERENCE HABILITATION OU C.E.', value: 'emptyfield' };
        const fieldToBeAdded23 = { label: 'DATE FIN DE VALIDITE HABILITATION OU C.E.', value: 'emptyfield' };
        const fieldToBeAdded24 = { label: 'EXTENSION PHOTO', value: 'emptyfield' };
        const fieldToBeAdded25 = { label: 'TYPE DE BADGE', value: 'typeBadge' };
        const fieldToBeAdded26 = { label: 'NOM PERSONNE VISITEE', value: 'emptyfield' };
        const fieldToBeAdded27 = { label: 'PRENOM PERSONNE VISITEE', value: 'emptyfield' };
        const fieldToBeAdded28 = { label: 'CODE ACTION', value: 'emptyfield' };
        options.fields.splice(options.fields.findIndex((a) => a.label === 'NOM DE NAISSANCE'), 0, fieldToBeAdded1);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'NOM DE NAISSANCE'), 0, fieldToBeAdded2);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'NOM DE NAISSANCE'), 0, fieldToBeAdded3);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'DATE DEBUT VALIDITE'), 0, fieldToBeAdded4);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'DATE DEBUT VALIDITE'), 0, fieldToBeAdded5);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'ORIGINE'), 0, fieldToBeAdded6);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'ORIGINE'), 0, fieldToBeAdded7);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded8);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded9);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded10);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded11);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded12);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded13);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded14);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded15);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded16);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded17);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded18);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded19);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded20);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded21);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded22);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded23);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded24);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded25);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded26);
        options.fields.splice(options.fields.findIndex((a) => a.label === 'N° DEMANDE'), 0, fieldToBeAdded27);
        options.fields.push(fieldToBeAdded28);

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

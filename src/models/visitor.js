import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import {
  WORKFLOW_BEHAVIOR_ACK,
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_ADVISEMENT_DECISIONS,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_INFORMATION_DECISIONS,
  WORKFLOW_BEHAVIOR_VALIDATION,
  WORKFLOW_BEHAVIOR_VALIDATION_DECISIONS,
  WORKFLOW_DECISION_ACCEPTED,
  WORKFLOW_DECISION_POSITIVE,
  WORKFLOW_ENUM,
} from './unit';
import { HYDRATION_FORCE, HYDRATION_KEY } from './helpers/graphql-projection';
// eslint-disable-next-line import/no-cycle
import {
  MODEL_NAME as REQUEST_MODEL_NAME,
  STATE_ACCEPTED,
  STATE_CANCELED,
  STATE_CREATED,
  STATE_DRAFTED,
  STATE_MIXED,
  STATE_REJECTED,
} from './request';
import { ROLE_ACCESS_OFFICE, ROLE_SCREENING } from './rules';
import { sendRequestRefusedVisitorMail, sendRequestAcceptedVisitorMail } from '../services/mail';

const { Schema } = mongoose;
export const MODEL_NAME = 'Visitor';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';
export const ID_DOCUMENT_CIMSCARD = 'CIMSCard';
export const CONVERT_DOCUMENT_IMPORT_XLSX = {
  [ID_DOCUMENT_CIMSCARD]: 'carte_cims',
  [ID_DOCUMENT_IDCARD]: 'carte_identité',
  [ID_DOCUMENT_PASSPORT]: 'passeport',
};

export const TYPE_VISITOR = 'TYPE_VISITOR';
export const TYPE_SUBCONTRACTOR = 'TYPE_SUBCONTRACTOR';
export const TYPE_INTERIM = 'TYPE_INTERIM';
export const TYPE_TRAINEE = 'TYPE_TRAINEE';
export const TYPE_DELIVERER = 'TYPE_DELIVERER';
export const TYPE_ACTIVE_MILITARY = 'TYPE_ACTIVE_MILITARY';
export const TYPE_RESERVIST = 'TYPE_RESERVIST';
export const TYPE_CIVILIAN_DEFENSE = 'TYPE_CIVILIAN_DEFENSE';
export const TYPE_FAMILY = 'TYPE_FAMILY';
export const TYPE_AUTHORITY = 'TYPE_AUTHORITY';
export const CONVERT_TYPE_IMPORT_XLSX = {
  [TYPE_VISITOR]: 'visiteur',
  [TYPE_SUBCONTRACTOR]: 'sous_traitant',
  [TYPE_INTERIM]: 'interimaire',
  [TYPE_TRAINEE]: 'stagiaire',
  [TYPE_DELIVERER]: 'livreur',
  [TYPE_ACTIVE_MILITARY]: 'militaire_d_active',
  [TYPE_RESERVIST]: 'réserviste',
  [TYPE_CIVILIAN_DEFENSE]: 'civil_de_la_défense',
  [TYPE_FAMILY]: 'famille',
  [TYPE_AUTHORITY]: 'autorité',
};

export const CONVERT_STATE_VISITOR_CSV = {
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  MIXED: 'Partiellement accepté',
  CREATED: 'En cours',
  CANCELED: 'Annulé',
};

export const GLOBAL_VALIDATION_ROLES = [ROLE_SCREENING, ROLE_ACCESS_OFFICE];

export const FIELDS_TO_SEARCH = [
  'nid',
  'firstname',
  'birthLastname',
  'usageLastname',
  'company',
  'rank',
  'nationality',
  'email',
];

export const EXPORT_CSV_VISITORS = [
  { label: 'STATUT', value: 'status' },
  { label: 'NOM ET EXTENSION PHOTO', value: 'null' },
  {
    label: 'ADRESSE MAIL DU RESPONSABLE "ACCES" UNITE/ENTREPRISE OBLIGATOIRE',
    value: 'null',
  },
  { label: 'CIVILITE', value: 'null' },
  { label: 'NOM DE NAISSANCE', value: 'birthLastname' },
  { label: 'NOM MARITAL', value: 'usageLastname' },
  { label: 'PRENOM', value: 'firstname' },
  {
    label: 'DATE DE NAISSANCE',
    value: 'birthday',
    format: { $dateToString: { format: '%d/%m/%Y', date: '$birthday' } },
  },
  { label: 'LIEU DE NAISSANCE', value: 'birthplace' },
  { label: 'UNITE / SOCIETE', value: 'company' },
  { label: 'SERVICE', value: 'null' },
  { label: 'VALIDITE ACCES', value: 'null' },
  {
    label: 'DATE DEBUT VALIDITE',
    value: 'request.from',
    format: { $dateToString: { format: '%d/%m/%Y', date: '$request.from' } },
  },
  {
    label: 'DATE FIN VALIDITE',
    value: 'request.to',
    format: { $dateToString: { format: '%d/%m/%Y', date: '$request.to' } },
  },
  {
    label: 'NATIONALITE',
    value: 'nationality',
    // $toUpper is not enough, doing a toUpperCase in export
    format: { $toUpper: '$nationality' },
  },
  { label: 'PAYS DE NAISSANCE', value: 'null' },
  { label: 'LIEU(X) DE TRAVAIL', value: 'null' },
  { label: 'ORIGINE', value: 'isInternal' },
  { label: 'TYPE D\'EMPLOYE', value: 'employeeType' },
  { label: 'DATE CRIBLAGE', value: 'dateScreening' },
  { label: 'ACCES HOMET', value: 'null' },
  { label: 'ACCES CACHIN', value: 'null' },
  { label: 'ACCES COMNORD', value: 'null' },
  { label: 'ACCES NARDOUET', value: 'null' },
  { label: 'ACCES ILOT SUD', value: 'null' },
  { label: 'ACCES H3', value: 'null' },
  { label: 'ADRESSE MAIL UNITE CONTRACTANTE', value: 'null' },
  { label: 'DROIT DE CONDUITE', value: 'null' },
  { label: 'PROFIL D\'ACCES', value: 'null' },
  { label: 'COMMENTAIRE', value: 'null' },
  { label: 'FREQUENCE DE VISITE', value: 'null' },
  { label: 'ENVOI MAIL', value: 'null' },
  { label: 'IMPORTATION PROTECTER', value: 'null' },
  { label: 'REFERENCE HABILITATION OU C.E.', value: 'null' },
  { label: 'DATE FIN DE VALIDITE HABILITATION OU C.E.', value: 'null' },
  { label: 'EXTENSION PHOTO', value: 'null' },
  { label: 'TYPE DE BADGE', value: 'typeBadge' },
  { label: 'NOM PERSONNE VISITEE', value: 'null' },
  { label: 'PRENOM PERSONNE VISITEE', value: 'null' },
  { label: 'No DEMANDE', value: 'request._id' },
  { label: 'CODE ACTION', value: 'null' },
  // need this field to build other fields in CSV export file
  { label: 'UNITES', value: 'request.units' },
];

export const XLSX_ID_KIND_LABEL = 'Type document identité*';
export const XLSX_ID_REFERENCE_LABEL = 'Numéro document identité*';
export const XLSX_NATIONALITY_LABEL = 'Nationalité*';
export const XLSX_INTERNAL_LABEL = 'MINARM*';
export const XLSX_EMPLOYEE_TYPE_LABEL = 'Type d\'employé*';
export const XLSX_VIP_LABEL = 'VIP*';
export const XLSX_IDENTITY_VALUE = 'identityDocuments';
export const XLSX_BOOLEAN_VALUE = 'oui,non';
export const EMPLOYEE_TYPE_XLSX_LIST = Object.values(CONVERT_TYPE_IMPORT_XLSX).join();
export const ID_DOCUMENT_XLSX_LIST = Object.values(CONVERT_DOCUMENT_IMPORT_XLSX).join();

export const EXPORT_XLSX_TEMPLATE_VISITORS = [
  {
    header: XLSX_INTERNAL_LABEL, key: 'isInternal', enum: [XLSX_BOOLEAN_VALUE],
  },
  { header: 'NID', key: 'nid' },
  {
    header: XLSX_EMPLOYEE_TYPE_LABEL, key: 'employeeType', enum: EMPLOYEE_TYPE_XLSX_LIST,
  },
  { header: 'Prénom*', key: 'firstname' },
  { header: 'Nom de Naissance*', key: 'birthLastname' },
  { header: "Nom d'usage", key: 'usageLastname' },
  { header: 'Grade', key: 'rank' },
  { header: 'Unité / Entreprise*', key: 'company' },
  {
    header: XLSX_VIP_LABEL, key: 'vip', enum: XLSX_BOOLEAN_VALUE,
  },
  { header: 'Motif VIP', key: 'vipReason' },
  { header: XLSX_NATIONALITY_LABEL, key: 'nationality' },
  { header: 'Date de Naissance [jj/mm/aaaa]*', key: 'birthday' },
  { header: 'Lieu de Naissance*', key: 'birthplace' },
  {
    header: XLSX_ID_KIND_LABEL, key: XLSX_IDENTITY_VALUE, enum: ID_DOCUMENT_XLSX_LIST,
  },
  { header: XLSX_ID_REFERENCE_LABEL, key: XLSX_IDENTITY_VALUE },
];

export const BUCKETNAME_VISITOR_FILE = 'visitorIdFile';

const VisitorSchema = new Schema({
  nid: String,
  firstname: {
    type: String,
    required: true,
  },
  birthLastname: {
    type: String,
    required: true,
  },
  usageLastname: String,
  isInternal: {
    type: Boolean,
    default: false,
  },
  employeeType: {
    type: String,
    enum: [
      TYPE_VISITOR,
      TYPE_SUBCONTRACTOR,
      TYPE_INTERIM,
      TYPE_TRAINEE,
      TYPE_DELIVERER,
      TYPE_ACTIVE_MILITARY,
      TYPE_RESERVIST,
      TYPE_CIVILIAN_DEFENSE,
      TYPE_FAMILY,
      TYPE_AUTHORITY,
    ],
  },
  company: {
    type: String,
    required: true,
  },
  rank: String,
  email: {
    type: String,
    match: new RegExp(
      '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}'
      + '[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
    ),
    required() {
      return !this.request.referent.email;
    },
    maxlength: 256,
  },
  vip: {
    type: Boolean,
    required: true,
    default: false,
  },
  vipReason: {
    type: String,
    required() {
      return this.vip;
    },
  },
  nationality: {
    type: String,
    required: true,
  },
  identityDocuments: [{
    kind: {
      type: String,
      enum: [ID_DOCUMENT_IDCARD, ID_DOCUMENT_PASSPORT, ID_DOCUMENT_CIMSCARD],
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    file: {
      _id: {
        type: Schema.ObjectId,
        alias: 'file.id',
      },
    },
  }],
  birthday: {
    type: Date,
    required: true,
  },
  birthplace: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: STATE_DRAFTED,
  },
  exportDate: {
    type: Date,
  },
  request: {
    _id: {
      type: String,
      alias: 'request.id',
      required: true,
    },
    object: { type: String, required: true },
    reason: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    campus: {
      _id: { type: String, required: true, alias: 'campus.id' },
      label: String,
    },
    owner: {
      _id: {
        type: Schema.ObjectId,
        required: true,
        alias: 'owner.id',
      },
      firstname: String,
      lastname: String,
      email: {
        original: String,
        canonical: String,
      },
    },
    referent: {
      email: String,
      firstname: String,
      lastname: String,
      phone: String,
    },
    places: [
      {
        _id: { type: Schema.ObjectId, required: true, alias: 'id' },
        label: { type: String, required: true },
        zone: {
          _id: { type: Schema.ObjectId },
          label: { type: String },
        },
        unitInCharge: {
          _id: { type: Schema.ObjectId },
          label: { type: String },
        },
      },
    ],
    units: [
      {
        _id: { type: Schema.ObjectId, required: true, alias: 'id' },
        label: { type: String, required: true },
        workflow: {
          steps: [
            {
              role: String,
              behavior: {
                type: String,
                enum: WORKFLOW_ENUM,
              },
              state: {
                value: String,
                isOK: Boolean,
                date: Date,
                payload: {
                  tags: [String],
                },
              },
            },
          ],
        },
      },
    ],
  },
}, {
  timestamps: true,
  [HYDRATION_KEY]: {
    [HYDRATION_FORCE]: ['request', 'state'],
  },
});

VisitorSchema.post('save', async (visitor) => {
  if (visitor.markedForRequestComputation) {
    await visitor.invokeRequestComputation();
  }
});

VisitorSchema.methods.validateStep = function recordStepResult(
  unitID,
  role,
  decision,
  tags = [],
  autoValidation = false,
) {
  if (GLOBAL_VALIDATION_ROLES.includes(role)) {
    const isOneUnitPreviousRoleOk = this.request.units.find((u) => u.workflow.steps.find(
      (s, index) => s.role === role && (index === 0 || u.workflow.steps[index - 1].state.value),
    ));
    if (!isOneUnitPreviousRoleOk) {
      throw new Error(`Previous step for role ${role} not yet validated`);
    }
  }

  const unit = this.request.units.find((u) => u._id.toString() === unitID);
  const step = unit.workflow.steps.find((s) => s.role === role);
  if (this.status !== STATE_CREATED && !autoValidation) {
    throw new Error(`Visitor cannot be validated while in status "${this.status}"`);
  }

  if (step.state.value) {
    throw new Error(`Step "${step._id.toString()}" already validated`);
  }

  if (!GLOBAL_VALIDATION_ROLES.includes(role) && !autoValidation
    && Array.from({ length: unit.workflow.steps.indexOf(step) }).reduce((acc, row, index) => {
      if (!acc) {
        // Input sanitized by graphQL.
        // eslint-disable-next-line security/detect-object-injection
        return typeof unit.workflow.steps[index].state.value === 'undefined';
      }
      return acc;
    }, false)) {
    throw new Error(`Previous step for role ${role} not yet validated`);
  }

  switch (step.behavior) {
    case WORKFLOW_BEHAVIOR_VALIDATION:
      if (!WORKFLOW_BEHAVIOR_VALIDATION_DECISIONS.includes(decision)) {
        throw new Error(`Validation behavior cannot accept "${decision}" decision.`);
      }
      step.state.isOK = decision === WORKFLOW_DECISION_ACCEPTED;
      break;
    case WORKFLOW_BEHAVIOR_ADVISEMENT:
      if (!WORKFLOW_BEHAVIOR_ADVISEMENT_DECISIONS.includes(decision)) {
        throw new Error(`Advisement behavior cannot accept "${decision}" decision.`);
      }
      step.state.isOK = decision === WORKFLOW_DECISION_POSITIVE;
      break;
    case WORKFLOW_BEHAVIOR_INFORMATION:
      if (!WORKFLOW_BEHAVIOR_INFORMATION_DECISIONS.includes(decision)) {
        throw new Error(`Information behavior cannot accept "${decision}" decision.`);
      }
      step.state.isOK = decision === WORKFLOW_BEHAVIOR_ACK;
      break;
    default:
      throw new Error('Unexpected behavior');
  }
  step.state.payload.tags = tags;
  step.state.value = decision;
  step.state.date = new Date();

  this.guessStatus();
  if (this.status === STATE_CREATED && !(step.behavior === WORKFLOW_BEHAVIOR_VALIDATION && !step.state.isOK)) {
    this.sendNextStepMail(unit);
  }
  return this;
};

VisitorSchema.methods.cancelVisitor = async function cancelVisitor() {
  this.status = STATE_CANCELED;
  this.markedForRequestComputation = true;
  return this;
};

VisitorSchema.methods.guessStatus = async function invokeRequestComputation() {
  const allOK = this.request.units.reduce(
    (acc, unit) => {
      if (unit.workflow.steps.find((s) => s.behavior === WORKFLOW_BEHAVIOR_VALIDATION && s.state.isOK === false)) {
        return acc.concat(false);
      }
      return acc.concat(...unit.workflow.steps.map((s) => s.state.isOK));
    },
    [],
  );
  if (allOK.every((e) => e === true)) {
    this.status = STATE_ACCEPTED;
  } else if (allOK.every((e) => e === false)) {
    this.status = STATE_REJECTED;
  } else if (allOK.every((e) => [false, true].includes(e))) {
    this.status = STATE_MIXED;
  }
  if (this.isModified('status')) {
    this.markedForRequestComputation = true;
    this.sendVisitorResultMail();
  }
};

VisitorSchema.methods.invokeRequestComputation = async function invokeRequestComputation() {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  const request = await Request.findById(this.request._id);
  return request.computeStateComputation();
};

VisitorSchema.methods.sendNextStepMail = async function sendNextStepMail(unit) {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  const request = await Request.findById(this.request._id);
  request.requestValidationStepMail(unit);
};

VisitorSchema.methods.sendVisitorResultMail = async function sendVisitorResultMail() {
  const date = (value) => DateTime.fromJSDate(value).toFormat('dd/LL/yyyy');
  const targetMail = this.request.referent.email || this.email;
  const mailDatas = {
    base: this.request.campus.label,
    from: date(this.request.from),
    owner: this.request.owner.toObject(),
  };
  const sendMail = this.status === STATE_REJECTED
    ? sendRequestRefusedVisitorMail(mailDatas.base, mailDatas.from)
    : sendRequestAcceptedVisitorMail(mailDatas.base, mailDatas.from);
  return sendMail(targetMail, { data: mailDatas });
};

export default mongoose.model(MODEL_NAME, VisitorSchema, 'visitors');

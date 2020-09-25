import mongoose from 'mongoose';
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

const { Schema } = mongoose;
export const MODEL_NAME = 'Visitor';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';
export const ID_DOCUMENT_CIMSCARD = 'CIMSCard';

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
  { label: 'Id', value: '_id' },
  { label: 'Status', value: 'status' },
  { label: 'Date d\'arrivée', value: 'request.from' },
  { label: 'Date de départ', value: 'request.to' },
  { label: 'Motif', value: 'request.reason' },
  { label: 'Nature Visite', value: 'request.object' },
  { label: 'Demande', value: 'request._id' },
  { label: 'MINARM', value: 'isInternal' },
  { label: 'Prénom', value: 'firstname' },
  { label: 'Nom d\'usage', value: 'usageLastname' },
  { label: 'Nom de naissance', value: 'birthLastname' },
  { label: 'Nationalité', value: 'nationality' },
  { label: 'Date de naissance', value: 'birthday' },
  { label: 'Lieu de naissance', value: 'birthplace' },
  { label: 'Typ d\'employé', value: 'employeeType' },
  { label: 'Date de création', value: 'createdAt' },
  { label: 'Date de mise à jour', value: 'updatedAt' },
];
export const EXPORT_CSV_TEMPLATE_VISITORS = [
  { label: 'MINARM', value: 'isInternal' },
  { label: 'NID*', value: 'nid' },
  { label: 'Type d\'employé', value: 'employeeType' },
  { label: 'Prénom', value: 'firstname' },
  { label: 'Nom de Naissance', value: 'birthLastname' },
  { label: 'Nom d\'usage', value: 'usageLastname' },
  { label: 'Email', value: 'email' },
  { label: 'Grade*', value: 'rank' },
  { label: 'Unité / Entreprise', value: 'company' },
  { label: 'VIP', value: 'vip' },
  { label: 'Motif VIP', value: 'vipReason' },
  { label: 'Nationalité', value: 'nationality' },
  { label: 'Date de Naissance', value: 'birthday' },
  { label: 'Lieu de Naissance', value: 'birthplace' },
  { label: 'Type document identité', value: 'identityDocuments.kind' },
  { label: 'Numéro document identité', value: 'identityDocuments.reference' },
  { label: 'Fichier document identité', value: 'identityDocuments.file.original' },
];

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
  company: String,
  rank: String,
  email: String,
  vip: Boolean,
  vipReason: String,
  nationality: String,
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
    places: [
      {
        _id: { type: Schema.ObjectId, required: true, alias: 'id' },
        label: { type: String, required: true },
        zone: {
          _id: { type: Schema.ObjectId },
          label: { type: String },
        },
        unitInCharge: {
          _id: { type: Schema.ObjectId, required: true },
          label: { type: String, required: true },
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
) {
  if (GLOBAL_VALIDATION_ROLES.includes(role)) {
    const isOneUnitPreviousRoleOk = this.request.units.find((u) => u.workflow.steps.find(
      (s, index) => s.role === role && u.workflow.steps[index - 1].state.isOK,
    ));
    if (!isOneUnitPreviousRoleOk) {
      throw new Error(`Previous step for role ${role} not yet validated`);
    }
  }

  const unit = this.request.units.find((u) => u._id.toString() === unitID);
  const step = unit.workflow.steps.find((s) => s.role === role);
  if (this.status !== STATE_CREATED) {
    throw new Error(`Visitor cannot be validated while in status "${this.status}"`);
  }

  if (step.state.value) {
    throw new Error(`Step "${step._id.toString()}" already validated`);
  }

  if (!GLOBAL_VALIDATION_ROLES.includes(role)
    && Array.from({ length: unit.workflow.steps.indexOf(step) }).reduce((acc, row, index) => {
      if (!acc) {
        return typeof unit.workflow.steps[index].state.value === 'undefined';
      }
      return acc;
    }, false)) {
    throw new Error(`Previous step of "${step._id.toString()}" not yet validated`);
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
  }
};

VisitorSchema.methods.invokeRequestComputation = async function invokeRequestComputation() {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  const request = await Request.findById(this.request._id);
  return request.computeStateComputation();
};

export default mongoose.model(MODEL_NAME, VisitorSchema, 'visitors');

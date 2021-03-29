import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import {
  Machine as StateMachine, interpret, State,
} from 'xstate';
import {
  MODEL_NAME as UNIT_MODEL_NAME,
  WORKFLOW_DECISION_ACCEPTED,
  WORKFLOW_ENUM,
} from './unit';
// eslint-disable-next-line import/no-cycle
import {
  GLOBAL_VALIDATION_ROLES,
  MODEL_NAME as VISITOR_MODEL_NAME,
  EXPORT_CSV_TEMPLATE_VISITORS,
  CSV_ID_KIND_LABEL,
  CSV_ID_REFERENCE_LABEL,
  CSV_BOOLEAN_VALUE,
  CONVERT_DOCUMENT_IMPORT_CSV,
  CONVERT_TYPE_IMPORT_CSV,
  CSV_INTERNAL_LABEL,
  CSV_VIP_LABEL,
  CSV_EMPLOYEE_TYPE_LABEL,
} from './visitor';
import RequestCounter from './request-counters';
import config from '../services/config';
import {
  sendRequestCreationMail,
  sendRequestValidatedOwnerMail,
  sendRequestValidationStepMail,
} from '../services/mail';
import { MODEL_NAME as USER_MODEL_NAME } from './user';
import { ROLE_ACCESS_OFFICE, ROLE_SCREENING, ROLE_UNIT_CORRESPONDENT } from './rules';
import { uploadFile } from './helpers/upload';

export const DEFAULT_TIMEZONE = config.get('default_timezone');

const { Schema } = mongoose;
export const MODEL_NAME = 'Request';

export const STATE_DRAFTED = 'DRAFTED';
export const STATE_CREATED = 'CREATED';
export const STATE_CANCELED = 'CANCELED';
export const STATE_REMOVED = 'REMOVED';
export const STATE_ACCEPTED = 'ACCEPTED';
export const STATE_REJECTED = 'REJECTED';
export const STATE_MIXED = 'MIXED';

export const EVENT_CREATE = 'CREATE';
export const EVENT_CANCEL = 'CANCEL';
export const EVENT_REMOVE = 'REMOVE';
export const EVENT_ACCEPT = 'ACCEPT';
export const EVENT_REJECT = 'REJECT';
export const EVENT_MIX = 'MIX';

const RequestSchema = new Schema({
  _id: { type: String, alias: 'id' },
  object: { type: String, required: true },
  reason: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  campus: {
    _id: { type: String, required: true },
    label: String,
    trigram: String,
    timezone: {
      type: String,
      default: process.env.TZ || DEFAULT_TIMEZONE,
    },
  },
  owner: {
    _id: {
      type: Schema.ObjectId,
      required: true,
      alias: 'owner.id',
    },
    firstname: String,
    lastname: String,
    unit: {
      _id: Schema.ObjectId,
      label: String,
    },
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
  status: {
    type: String,
    default: STATE_DRAFTED,
  },
  places: [
    {
      _id: { type: Schema.ObjectId },
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
      _id: { type: Schema.ObjectId },
      label: { type: String, required: true },
      workflow: {
        steps: [
          {
            role: String,
            behavior: {
              type: String,
              enum: WORKFLOW_ENUM,
            },
          },
        ],
      },
    },
  ],
}, { timestamps: true });

RequestSchema.index({
  _id: 'text',
  object: 'text',
  reason: 'text',
});

RequestSchema.pre('save', async function preSave() {
  if (!this._id) {
    this._id = await this.generateID();
  }
  await this.cacheUnitsFromPlaces(true);
});

RequestSchema.virtual('stateMachine').get(function stateMachineVirtual() {
  return new StateMachine(this.workflow);
});

RequestSchema.virtual('workflow').get(function workflowVirtual() {
  return ({
    id: this._id,
    initial: STATE_DRAFTED,
    states: {
      [STATE_DRAFTED]: {
        on: {
          [EVENT_REMOVE]: STATE_REMOVED,
          [EVENT_CREATE]: STATE_CREATED,
        },
      },
      [STATE_CREATED]: {
        invoke: {
          src: async () => {
            this.markedForVisitorsCreation = true;
            const Visitor = mongoose.model(VISITOR_MODEL_NAME);
            const visitor = await Visitor.findOne({ 'request._id': this._id });
            visitor.request.units.toObject().map((unit) => this.requestValidationStepMail(unit));
            this.requestCreationMail();
          },
        },
        on: {
          [EVENT_CANCEL]: STATE_CANCELED,
          [EVENT_ACCEPT]: STATE_ACCEPTED,
          [EVENT_REJECT]: STATE_REJECTED,
          [EVENT_MIX]: STATE_MIXED,
        },
      },
      [STATE_REMOVED]: {
        invoke: {
          src: async () => {
            const Request = mongoose.model(MODEL_NAME);
            const Visitor = mongoose.model(VISITOR_MODEL_NAME);
            const removed = await Request.deleteOne({ _id: this._id, __v: this.__v });
            if (removed.ok === 1 && removed.deletedCount === 1) {
              await Visitor.deleteMany({ 'request._id': this._id });
            }
          },
        },
        type: 'final',
      },
      [STATE_CANCELED]: {
        invoke: {
          src: () => { this.markedForVisitorsCancelation = true; },
        },
        type: 'final',
      },
      [STATE_ACCEPTED]: {
        type: 'final',
      },
      [STATE_REJECTED]: {
        type: 'final',
      },
      [STATE_MIXED]: {
        type: 'final',
      },
    },
  });
});

RequestSchema.post('save', async (request) => {
  if (request.markedForVisitorsCreation) {
    await request.createVisitors();
  }
  if (request.markedForVisitorsCancelation) {
    await request.cancelVisitors();
  }
});

RequestSchema.virtual('interpretedStateMachine').get(function getInterpretedMachine() {
  const service = interpret(this.stateMachine);
  if (this.status) {
    const previousState = State.from(this.status);
    const resolvedState = this.stateMachine.resolveState(previousState);
    service.start(resolvedState);
  } else {
    service.start();
  }
  return service;
});

RequestSchema.methods.listPossibleEvents = function listPossibleEvents() {
  return this.interpretedStateMachine.state.nextEvents;
};

RequestSchema.methods.stateMutation = async function stateMutation(...params) {
  const service = this.interpretedStateMachine;
  await service.send(...params);
  this.status = service.state.value;
  return this;
};

RequestSchema.methods.generateID = async function generateID() {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  const unit = await Unit.findById(this.owner.unit._id);
  const date = DateTime.fromJSDate(this.createdAt).setZone(this.campus.timezone).startOf('day');
  const sequence = await RequestCounter.getNextSequence(this.campus._id, date);
  return `${this.campus.trigram}${unit.trigram}${date.toFormat('yyyyLLdd')}-${sequence}`;
};

RequestSchema.methods.cacheUnitsFromPlaces = async function cacheUnits(fetchInDatabase = false) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  this.units = this.places.map((p) => {
    if (p.unitInCharge && p.unitInCharge._id) {
      return p.unitInCharge;
    }
    return this.owner.unit;
  })
    .filter((unit, index, units) => units.findIndex((u) => u._id.equals(unit._id)) === index);
  if (fetchInDatabase) {
    this.units = await Unit.find({ _id: { $in: this.units.map((unit) => unit._id) } });
  }
  return this;
};

RequestSchema.methods.createVisitor = async function createVisitor(data, role) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const visitor = new Visitor(data);
  visitor.request = this;
  if (role === ROLE_UNIT_CORRESPONDENT) {
    await visitor.validateStep(this.owner.unit._id.toString(), role, WORKFLOW_DECISION_ACCEPTED, [], true);
  }
  return visitor.save();
};

RequestSchema.methods.createGroupVisitors = async function createGroupVisitor(visitorsDatas, role) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Promise.all(visitorsDatas.map(async (data, index) => {
    const findConvertData = (convertList, value) => {
      const convertedValue = Object.entries(convertList)
        .find(([, enumValue]) => typeof value === 'string' && enumValue === value.toLowerCase());
      return convertedValue ? convertedValue[0] : null;
    };

    const initVisitor = {
      identityDocuments: [{
        kind: findConvertData(CONVERT_DOCUMENT_IMPORT_CSV, data[CSV_ID_KIND_LABEL]),
        reference: data[CSV_ID_REFERENCE_LABEL],
      }],
    };
    const visitor = EXPORT_CSV_TEMPLATE_VISITORS.reduce((v, field) => {
      switch (field.label) {
        case CSV_INTERNAL_LABEL:
        case CSV_VIP_LABEL:
          if (typeof data[field.label] === 'string'
            && [CSV_BOOLEAN_VALUE.YES, CSV_BOOLEAN_VALUE.NO].includes(data[field.label].toLowerCase())) {
            const value = data[field.label].toLowerCase() === CSV_BOOLEAN_VALUE.YES;
            return { ...v, [field.value]: value };
          }
          return { ...v, [field.value]: null };
        case CSV_EMPLOYEE_TYPE_LABEL:
          return {
            ...v,
            [field.value]: findConvertData(CONVERT_TYPE_IMPORT_CSV, data[field.label]),
          };
        case CSV_ID_KIND_LABEL:
        case CSV_ID_REFERENCE_LABEL:
          return v;
        default:
          return { ...v, [field.value]: data[field.label] };
      }
    }, initVisitor);

    const v = new Visitor(visitor);
    v.request = this;
    const err = v.validateSync();
    if (err) {
      const errors = Object.values(err.errors).map((e) => ({ lineNumber: index + 1, field: e.path, kind: e.kind }));
      return { visitor: null, errors };
    }
    if (role === ROLE_UNIT_CORRESPONDENT) {
      await v.validateStep(this.owner.unit._id.toString(), role, WORKFLOW_DECISION_ACCEPTED, [], true);
    }
    const visitorSaved = await v.save();
    return {
      visitor: visitorSaved,
      errors: null,
    };
  }));
};

RequestSchema.methods.findVisitorByIdAndRemove = async function findVisitorByIdAndRemove(id) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.findOneAndRemove({ _id: id, 'request._id': this._id });
};

RequestSchema.methods.findVisitorsWithProjection = function findVisitorsWithProjection(filters, ...params) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.findWithProjection({ ...filters, 'request._id': this._id }, ...params);
};

RequestSchema.methods.countVisitors = async function countVisitors(filters) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.countDocuments({ ...filters, 'request._id': this._id });
};

RequestSchema.methods.uploadVisitorIdFile = async function uploadVisitorIdFile(visitor, bucketName) {
  const dbFilename = `scan${visitor.identityDocuments[0].kind}_${visitor.birthLastname}_${visitor.firstname}`;
  const file = await uploadFile(visitor.file[0].files.file, dbFilename, bucketName);
  return file;
};

RequestSchema.methods.computeStateComputation = async function computeStateComputation() {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const r = await Visitor.aggregate([
    { $match: { 'request._id': this._id } },
    { $project: { _id: 1, status: 1 } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  if (r.some(({ _id }) => typeof _id !== 'string')) {
    return this;
  }
  if (r.every(({ _id }) => _id === STATE_REJECTED)) {
    this.status = STATE_REJECTED;
  } else if (r.every(({ _id }) => _id === STATE_ACCEPTED)) {
    this.status = STATE_ACCEPTED;
  } else if (r.every(({ _id }) => _id === STATE_CANCELED)) {
    this.status = STATE_CANCELED;
  } else if (r.every(({ _id }) => [STATE_ACCEPTED, STATE_REJECTED, STATE_MIXED, STATE_CANCELED].includes(_id))) {
    this.status = STATE_MIXED;
  }
  if ([STATE_REJECTED, STATE_ACCEPTED, STATE_MIXED].includes(this.status)) {
    this.requestValidatedOwnerMail();
  }
  return this.save();
};

RequestSchema.methods.createVisitors = async function createVisitors() {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  // @todo: batch this in a queue system for requests with a lot of visitors
  return Visitor.updateMany({ 'request._id': this._id }, { status: STATE_CREATED });
};

RequestSchema.methods.cancelVisitors = async function cancelVisitors() {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  // @todo: batch this in a queue system for requests with a lot of visitors
  return Visitor.updateMany({ 'request._id': this._id }, { status: STATE_CANCELED });
};

RequestSchema.methods.requestCreationMail = async function requestCreationMail() {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const visitors = await Visitor.find({ 'request._id': this._id });
  const date = (value) => DateTime.fromJSDate(value).toFormat('dd/LL/yyyy');
  const mailDatas = {
    base: this.campus.label,
    from: date(this.from),
    to: date(this.to),
    owner: this.owner,
    reason: this.reason,
    places: `${this.places.map((p) => p.label).join(' / ')}`,
  };
  await Promise.all(visitors.map(async (v) => {
    const sendMail = sendRequestCreationMail(mailDatas.base, mailDatas.from);
    sendMail(v.email, { data: mailDatas });
  }));
};

RequestSchema.methods.findNextStepsUsersToNotify = async function findNextStepsUsers(unit) {
  const User = mongoose.model(USER_MODEL_NAME);
  const nextStep = unit.workflow.steps.find((s) => !s.state || !s.state.value);
  if (!nextStep || [ROLE_ACCESS_OFFICE, ROLE_SCREENING].includes(nextStep.role)) {
    return [];
  }
  const usersFilter = GLOBAL_VALIDATION_ROLES.includes(nextStep.role)
    ? { 'roles.role': nextStep.role }
    : { roles: { $elemMatch: { role: nextStep.role, 'units._id': unit._id } } };
  const usersToNotify = await User.find(usersFilter);
  return usersToNotify;
};

RequestSchema.methods.requestValidationStepMail = async function requestValidationStepMail(unit) {
  const usersToNotify = await this.findNextStepsUsersToNotify(unit);
  const date = (value) => DateTime.fromJSDate(value).toFormat('dd/LL/yyyy');
  const mailDatas = {
    base: this.campus.label,
    request: { id: this._id, link: `${config.get('website_url')}/demandes/a-traiter/${this._id}` },
    from: date(this.from),
    to: date(this.to),
    owner: this.owner,
    reason: this.reason,
    places: `${this.places.map((p) => p.label).join(' / ')}`,
  };
  await Promise.all(usersToNotify.map(async (user) => {
    const sendMail = sendRequestValidationStepMail(mailDatas.from);
    sendMail(user.email.original, { data: mailDatas });
  }));
};

RequestSchema.methods.requestValidatedOwnerMail = async function validatedRequestOwnerMail() {
  const User = mongoose.model(USER_MODEL_NAME);
  const findUsers = await Promise.all(this.units.map(async (u) => {
    const users = await User.find({
      roles: {
        $elemMatch: { role: ROLE_UNIT_CORRESPONDENT, 'units._id': u._id },
      },
    });
    return users;
  }));
  const usersMail = findUsers
    .reduce((users, current) => ([...current, ...users]), [])
    .map((u) => u.email.original);
  const isAccepted = [STATE_ACCEPTED, STATE_MIXED].includes(this.status);
  const refusedVisitors = await this.findVisitorsWithProjection({ status: STATE_REJECTED });
  const date = (value) => DateTime.fromJSDate(value).toFormat('dd/LL/yyyy');
  const mailDatas = {
    base: this.campus.label,
    request: {
      id: this._id,
      link: `${config.get('website_url')}/demandes/traitees/${this._id}`,
    },
    isAccepted,
    refusedVisitors: this.status === STATE_MIXED
      ? refusedVisitors.map((v) => v.toObject())
      : null,
    from: date(this.from),
    createdAt: date(this.createdAt),
    owner: this.owner,
    contact: usersMail.join(', '),
  };
  const sendMail = sendRequestValidatedOwnerMail(mailDatas.base, mailDatas.from);
  sendMail(this.owner.email.original, { data: mailDatas });
};

export default mongoose.model(MODEL_NAME, RequestSchema, 'requests');

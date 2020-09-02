import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import {
  Machine as StateMachine, interpret, State,
} from 'xstate';
import {
  MODEL_NAME as UNIT_MODEL_NAME, WORKFLOW_ENUM,
} from './unit';
// eslint-disable-next-line import/no-cycle
import {
  MODEL_NAME as VISITOR_MODEL_NAME,
} from './visitor';
import RequestCounter from './request-counters';
import config from '../services/config';

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
    unit: String,
    email: {
      original: String,
      canonical: String,
    },
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
        label: { type: String, required: true },
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
          src: () => { this.markedForVisitorsCreation = true; },
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
  const date = DateTime.fromJSDate(this.createdAt).setZone(this.campus.timezone).startOf('day');
  const sequence = await RequestCounter.getNextSequence(this.campus._id, date);
  return `${this.campus._id}${date.toFormat('yyyyLLdd')}-${sequence}`;
};

RequestSchema.methods.cacheUnitsFromPlaces = async function cacheUnits(fetchInDatabase = false) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  this.units = this.places.map((p) => p.unitInCharge)
    .filter((unit, index, units) => units.findIndex((u) => u._id.equals(unit._id)) === index);
  if (fetchInDatabase) {
    this.units = await Unit.find({ _id: { $in: this.units.map((unit) => unit._id) } });
  }
  return this;
};

RequestSchema.methods.createVisitor = async function createVisitor(data) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const visitor = new Visitor(data);
  visitor.request = this;
  return visitor.save();
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
  } else if (r.every(({ _id }) => [STATE_ACCEPTED, STATE_REJECTED].includes(_id))) {
    this.status = STATE_MIXED;
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

export default mongoose.model(MODEL_NAME, RequestSchema, 'requests');

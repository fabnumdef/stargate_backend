import mongoose from 'mongoose';
import { Machine as StateMachine, interpret, State } from 'xstate';
import {
  MODEL_NAME as UNIT_MODEL_NAME, WORKFLOW_ENUM,
} from './unit';

const { Schema } = mongoose;
export const MODEL_NAME = 'Visitor';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';
export const ID_DOCUMENT_CIMSCARD = 'CIMSCard';

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
  usageLastname: {
    type: String,
    required: true,
  },
  isInternal: {
    type: Boolean,
    default: false,
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
  stateValue: Object,
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
            },
          ],
        },
      },
    ],
  },
}, { timestamps: true });

VisitorSchema.virtual('stateMachine').get(function stateMachineVirtual() {
  return new StateMachine(this.workflow);
});

/**
 * Identifiers syntax in the state machine, design to be readable, functional & uniq :
 * {LETTER}{mongo id, hexadecimal}, chained, from the most global to the most specific, left to right
 * letters :
 * - R for request
 * - V for visitor
 * - U for unit
 * - S for step
 */
VisitorSchema.virtual('workflow').get(function workflowVirtual() {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  if (this.request.units.length < 1) {
    throw new Error('To build workflow, a visitor should visit at least one unit.');
  }
  return ({
    id: this._id,
    initial: 'validation',
    context: {},
    states: {
      validation: {
        type: 'parallel',
        states: this.request.units.map((unit) => ({
          [`U${unit._id}`]: (new Unit(unit)).buildWorkflow(),
        })).reduce((acc, cur) => Object.assign(acc, cur), {}),
        on: {
          accept: 'accepted',
          reject: 'rejected',
          both: 'mixed',
        },
      },
      accepted: {
        type: 'final',
      },
      rejected: {
        type: 'final',
      },
      mixed: {
        type: 'final',
      },
    },
  });
});

VisitorSchema.methods.stateMutation = async function stateMutation(unit, step, transition) {
  const service = interpret(this.stateMachine);

  if (this.stateValue) {
    const previousState = State.from(this.stateValue);
    const resolvedState = this.stateMachine.resolveState(previousState);
    service.start(resolvedState);
  } else {
    service.start();
  }

  service.send(`U${unit._id}S${step._id}_${transition}`);
  return service;
};

export default mongoose.model(MODEL_NAME, VisitorSchema, 'visitors');

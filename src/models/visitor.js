import mongoose from 'mongoose';
import { Machine as StateMachine, interpret, State } from 'xstate';
import {
  MODEL_NAME as UNIT_MODEL_NAME, WORKFLOW_ENUM,
} from './unit';
import { HYDRATION_FORCE, HYDRATION_KEY } from './helpers/graphql-projection';

const { Schema, Types } = mongoose;
export const MODEL_NAME = 'Visitor';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';
export const ID_DOCUMENT_CIMSCARD = 'CIMSCard';

export const EMPLOYEE_TYPE_ENUM = [
  'Visiteur',
  'Sous-traitant',
  'Intérimaire',
  'Stagiaire',
  'Livreur',
  'Militaire d\'active',
  'Réserviste',
  'Civil de la défense',
  'Famille',
  'Autorité',
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
    enum: EMPLOYEE_TYPE_ENUM,
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
  state: {
    records: [{
      _id: {
        unit: Schema.ObjectId,
        step: Schema.ObjectId,
      },
      date: Date,
      action: String,
    }],
    value: Object,
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

VisitorSchema.virtual('interpretedStateMachine').get(function getInterpretedMachine() {
  const service = interpret(this.stateMachine);
  if (this.state.value) {
    const previousState = State.from(this.state.value);
    const resolvedState = this.stateMachine.resolveState(previousState);
    service.start(resolvedState);
  } else {
    service.start();
  }
  service.onTransition(({ changed }, {
    unitID, stepID, event,
  } = {}) => {
    if (!changed || !unitID || !stepID || !event) {
      return;
    }
    this.state.records.push({
      _id: {
        unit: unitID,
        step: stepID,
      },
      action: event,
      date: new Date(),
    });
  });
  return service;
});

VisitorSchema.virtual('status').get(function getSteps() {
  return this.request.units.reduce((unitAcc, unit) => Object.assign(unitAcc, {
    [unit._id.toString()]: unit.workflow.steps.reduce((stepAcc, step) => {
      const stepRecord = this.state.records
        .find(({ _id }) => _id.unit.equals(unit._id) && _id.step.equals(step._id)) || {};
      return Object.assign(stepAcc, {
        _id: unit._id,
        [step._id.toString()]: {
          ...step.toObject(),
          status: stepRecord.action || null,
          date: stepRecord.date || null,
          done: !!stepRecord.action,
        },
      });
    }, {}),
  }), {});
});

VisitorSchema.methods.getStep = function getStep(unitID, role) {
  const unitObjectID = new Types.ObjectId(unitID);
  try {
    return this.request.units
      .find((u) => u._id.equals(unitObjectID))
      .workflow.steps
      .find((s) => s.role === role) || null;
  } catch (_) {
    return null;
  }
};

VisitorSchema.methods.predicateEvent = function predicateEvent(unitID, stepID, event) {
  let predicatedEvent = '';
  if (unitID) {
    predicatedEvent += `U${unitID.toString ? unitID.toString() : unitID}`;
    if (stepID) {
      predicatedEvent += `S${stepID.toString ? stepID.toString() : stepID}`;
      if (event) {
        predicatedEvent += `_${event}`;
      }
    }
  }
  return predicatedEvent;
};

VisitorSchema.methods.listPossibleEvents = function listPossibleEvents() {
  return this.interpretedStateMachine.state.nextEvents;
};

VisitorSchema.methods.stateMutation = function stateMutation(unitID, stepID, event) {
  const service = this.interpretedStateMachine;
  service.send(this.predicateEvent(unitID, stepID, event), { unitID, stepID, event });
  this.state.value = service.state.value;
  return this;
};

export default mongoose.model(MODEL_NAME, VisitorSchema, 'visitors');

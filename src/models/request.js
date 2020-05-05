import mongoose from 'mongoose';
import {
  MODEL_NAME as UNIT_MODEL_NAME, WORKFLOW_ENUM,
} from './unit';

const { Schema } = mongoose;
export const MODEL_NAME = 'Request';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';

const RequestSchema = new Schema({
  object: { type: String, required: true },
  reason: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  campus: {
    _id: String,
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
  visitors: [
    {
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
      company: String,
      rank: String,
      email: String,
      vip: Boolean,
      vipReason: String,
      nationality: String,
      identityDocuments: [{
        kind: {
          type: String,
          enum: [ID_DOCUMENT_IDCARD, ID_DOCUMENT_PASSPORT],
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
      workflow: Object,
    },
  ],
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

RequestSchema.methods.cacheUnitsFromPlaces = async function cacheUnits(fetchInDatabase = false) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  this.units = this.places.map((p) => p.unitInCharge)
    .filter((unit, index, units) => units.findIndex((u) => u._id.equals(unit._id)) === index);
  if (fetchInDatabase) {
    this.units = await Unit.find({ _id: { $in: this.units.map((unit) => unit._id) } });
  }
  return this;
};

/**
 * Identifiers syntax in the state machine, design to be readable, functional & uniq :
 * {LETTER}{mongo id, hexadecimal}, chained, from the most global to the most specific, left to right
 * letters :
 * - R for request
 * - V for visitor
 * - U for unit
 * - S for step
 */
RequestSchema.methods.buildWorkflow = function buildWorkflow() {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  if (this.units.length < 1 || this.visitors.length < 1) {
    throw new Error('To build workflow, software needs at least one unit (at least one place), '
        + 'and at least one visitor.');
  }
  return ({
    id: `R${this._id}`,
    initial: 'draft',
    context: {},
    states: {
      draft: {
        on: {
          drafted: 'creation',
          cancel: 'canceled',
        },
      },
      canceled: {
        type: 'final',
      },
      creation: {
        on: {
          created: 'validation',
          cancel: 'canceled',
        },
      },
      validation: {
        type: 'parallel',
        on: {
          accept: 'accepted',
          reject: 'rejected',
          both: 'mixed',
        },
        states: {
          ...this.visitors.map((visitor) => {
            const visitorPrefix = `R${this._id}V${visitor._id}`;
            return {
              [visitorPrefix]: {
                initial: `${visitorPrefix}_validation`,
                states: {
                  [`${visitorPrefix}_validation`]: {
                    type: 'parallel',
                    states: this.units.map((unit) => ({
                      [`${visitorPrefix}U${unit._id}`]: (new Unit(unit)).buildWorkflow(visitorPrefix),
                    })).reduce((acc, cur) => Object.assign(acc, cur), {}),
                    on: {
                      [`${visitorPrefix}_accept`]: 'accepted',
                      [`${visitorPrefix}_reject`]: 'rejected',
                      [`${visitorPrefix}_both`]: 'mixed',
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
              },
            };
          }).reduce((acc, cur) => Object.assign(acc, cur), {}),

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
};

export default mongoose.model(MODEL_NAME, RequestSchema, 'requests');

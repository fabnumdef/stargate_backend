import mongoose from 'mongoose';
// disable eslint rule for import constant
// eslint-disable-next-line import/no-cycle
import { MODEL_NAME as PlaceModelName } from './place';
import { MODEL_NAME as UserModelName } from './user';

const { Schema } = mongoose;
export const MODEL_NAME = 'Unit';

// Validation is a blocking step
export const WORKFLOW_BEHAVIOR_VALIDATION = 'Validation';
// Information is a non-blocking step
export const WORKFLOW_BEHAVIOR_INFORMATION = 'Information';
export const WORKFLOW_BEHAVIOR_ADVISEMENT = 'Advisement';
export const WORKFLOW_ENUM = [
  WORKFLOW_BEHAVIOR_VALIDATION,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_ADVISEMENT,
];
const UnitSchema = new Schema({
  label: { type: String, required: true },
  trigram: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  },
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
}, { timestamps: true });

UnitSchema.methods.buildWorkflow = function buildWorkflow(prefix = '') {
  if (this.workflow.steps.length < 1) {
    throw new Error('To build workflow, unit needs at least one step.');
  }
  const unitPrefix = `${prefix}U${this._id}`;
  return {
    id: unitPrefix,
    initial: `${unitPrefix}S${this.workflow.steps[0]._id.toString()}`,
    context: {},
    states: {
      ...this.workflow.steps.map((step, index, steps) => {
        const on = {};
        switch (step.behavior) {
          case WORKFLOW_BEHAVIOR_VALIDATION:
            on[`${unitPrefix}S${step._id.toString()}_accept`] = steps[index + 1]
              ? `${unitPrefix}S${steps[index + 1]._id.toString()}`
              : 'accepted';
            on[`${unitPrefix}S${step._id.toString()}_reject`] = 'rejected';
            break;
          case WORKFLOW_BEHAVIOR_ADVISEMENT:
            if (!steps[index + 1]) {
              throw new Error('advisement cannot be in the latest step');
            }
            {
              const nextStep = `${unitPrefix}S${steps[index + 1]._id.toString()}`;
              on[`${unitPrefix}S${step._id.toString()}_positive`] = nextStep;
              on[`${unitPrefix}S${step._id.toString()}_negative`] = nextStep;
              on[`${unitPrefix}S${step._id.toString()}_externally`] = nextStep;
            }
            break;
          case WORKFLOW_BEHAVIOR_INFORMATION:
            if (!steps[index + 1]) {
              throw new Error('information cannot be in the latest step');
            }
            on[`${unitPrefix}S${step._id.toString()}_validated`] = `${unitPrefix}S${steps[index + 1]._id.toString()}`;
            break;
          default:
            throw new Error('Unexpected behavior value');
        }
        return {
          [`${unitPrefix}S${step._id.toString()}`]: {
            on,
          },
        };
      }).reduce((acc, cur) => Object.assign(acc, cur), {}),
      accepted: {
        type: 'final',
      },
      rejected: {
        type: 'final',
      },
    },
  };
};

UnitSchema.methods.deleteUnitDependencies = async function deleteUnitDependencies() {
  const Place = mongoose.model(PlaceModelName);
  const User = mongoose.model(UserModelName);
  const unitPlaces = await Place.find({ 'unitInCharge._id': this._id });
  const unitUsers = await User.find({ 'roles.units._id': this._id });

  if (unitPlaces) {
    await Promise.all(unitPlaces.map(async (place) => {
      place.set('unitInCharge', null, { strict: false });
      return place.save();
    }));
  }
  if (unitUsers) {
    await Promise.all(unitUsers.map(async (user) => {
      await user.deleteUserRole({ unitId: this._id });
      return user;
    }));
  }

  return this;
};

export default mongoose.model(MODEL_NAME, UnitSchema, 'units');

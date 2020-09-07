import mongoose from 'mongoose';
// disable eslint rule for import constant
// eslint-disable-next-line import/no-cycle
import { MODEL_NAME as PlaceModelName } from './place';
import { MODEL_NAME as UserModelName } from './user';

const { Schema } = mongoose;
export const MODEL_NAME = 'Unit';

// Validation is a blocking step
export const WORKFLOW_BEHAVIOR_VALIDATION = 'VALIDATION';
export const WORKFLOW_DECISION_ACCEPTED = 'ACCEPTED';
export const WORKFLOW_DECISION_REJECTED = 'REJECTED';
export const WORKFLOW_BEHAVIOR_VALIDATION_DECISIONS = [
  WORKFLOW_DECISION_REJECTED,
  WORKFLOW_DECISION_ACCEPTED,
];
// Information is a non-blocking step
export const WORKFLOW_BEHAVIOR_INFORMATION = 'INFORMATION';
export const WORKFLOW_BEHAVIOR_ACK = 'ACK';
export const WORKFLOW_BEHAVIOR_INFORMATION_DECISIONS = [WORKFLOW_BEHAVIOR_ACK];
export const WORKFLOW_BEHAVIOR_ADVISEMENT = 'ADVISEMENT';
export const WORKFLOW_DECISION_POSITIVE = 'POSITIVE';
export const WORKFLOW_DECISION_NEGATIVE = 'NEGATIVE';
export const WORKFLOW_DECISION_EXTERNALLY = 'EXTERNALLY';
export const WORKFLOW_BEHAVIOR_ADVISEMENT_DECISIONS = [
  WORKFLOW_DECISION_POSITIVE,
  WORKFLOW_DECISION_NEGATIVE,
  WORKFLOW_DECISION_EXTERNALLY,
];
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

UnitSchema.post('save', async (unit) => {
  await unit.editUnitDependencies();
});

UnitSchema.methods.editUnitDependencies = async function deleteUnitDependencies() {
  const Place = mongoose.model(PlaceModelName);
  const User = mongoose.model(UserModelName);
  const unitPlaces = await Place.find({ 'unitInCharge._id': this._id });
  const unitUsers = await User.find({ 'roles.units._id': this._id });
  if (unitPlaces) {
    await Promise.all(unitPlaces.map(async (place) => {
      place.set('unitInCharge', { _id: this._id, label: this.label }, { strict: false });
      return place.save();
    }));
  }
  if (unitUsers) {
    await Promise.all(unitUsers.map(async (user) => {
      user.roles.map((r) => {
        r.units.map((unit) => {
          if (unit._id.toString() === this._id.toString()) {
            unit.set({ _id: this._id, label: this.label });
          }
          return unit;
        });
        return r;
      });
      user.save();
    }));
  }
  return this;
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

import mongoose from 'mongoose';
// disable eslint rule for import constant
// eslint-disable-next-line import/no-cycle
import { MODEL_NAME as UnitModelName } from './unit';

const { Schema } = mongoose;
export const MODEL_NAME = 'Place';

const PlaceSchema = new Schema({
  label: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  },
  zone: {
    _id: { type: Schema.ObjectId },
    label: { type: String },
  },
  unitInCharge: {
    _id: { type: Schema.ObjectId },
    label: { type: String },
  },
}, { timestamps: true });

PlaceSchema.methods.setFromGraphQLSchema = async function setFromGraphQLSchema(data) {
  const Unit = mongoose.model(UnitModelName);
  const filteredData = data;
  if (data.unitInCharge) {
    filteredData.unitInCharge = await Unit.findById(data.unitInCharge);
  }

  this.set(filteredData);
};

export default mongoose.model(MODEL_NAME, PlaceSchema, 'places');

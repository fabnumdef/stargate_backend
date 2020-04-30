import mongoose from 'mongoose';

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
    label: { type: String, required: true },
  },
}, { timestamps: true });

export default mongoose.model(MODEL_NAME, PlaceSchema, 'places');

import mongoose from 'mongoose';

const { Schema } = mongoose;
export const MODEL_NAME = 'Unit';

const UnitSchema = new Schema({
  label: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timeunit: String,
  },
}, { timestamps: true });

export default mongoose.model(MODEL_NAME, UnitSchema, 'units');

import mongoose from 'mongoose';

const { Schema } = mongoose;
export const MODEL_NAME = 'Zone';

const ZoneSchema = new Schema({
  label: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  },
}, { timestamps: true });

export default mongoose.model(MODEL_NAME, ZoneSchema, 'zones');

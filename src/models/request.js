import mongoose from 'mongoose';

const { Schema } = mongoose;
export const MODEL_NAME = 'Request';

const RequestSchema = new Schema({
  object: { type: String, required: true },
  reason: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  campus: {
    _id: String,
    label: String,
  },
}, { timestamps: true });

export default mongoose.model(MODEL_NAME, RequestSchema, 'requests');

import mongoose from 'mongoose';

const { Schema } = mongoose;

const CampusSchema = new Schema({
  name: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  },
}, { timestamps: true });

export default mongoose.model('Zone', CampusSchema, 'zones');

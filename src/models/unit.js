import mongoose from 'mongoose';

const { Schema } = mongoose;

const CampusSchema = new Schema({
  name: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timeunit: String,
  }
}, { timestamps: true });

export default mongoose.model('Unit', CampusSchema, 'units');

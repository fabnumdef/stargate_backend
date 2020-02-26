import mongoose from 'mongoose';
import {MODEL_NAME as UserModelName} from './user';
import timezoneValidator from 'timezone-validator';
import config from '../services/config';

const DEFAULT_TIMEZONE = config.get('default_timezone');
const { Schema } = mongoose;

const CampusSchema = new Schema({
  name: { type: String, required: true },
  campus: {
    _id: String,
    label: String,
    timezone: String,
  }
}, { timestamps: true });

export default mongoose.model('Zone', CampusSchema, 'zones');

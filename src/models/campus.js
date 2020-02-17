import mongoose from 'mongoose';
import {MODEL_NAME as UserModelName} from './user';
import timezoneValidator from 'timezone-validator';
import config from '../services/config';

const DEFAULT_TIMEZONE = config.get('default_timezone');
const { Schema } = mongoose;

const CampusSchema = new Schema({
  _id: { type: String, alias: 'id' },
  name: { type: String, required: true },
  timezone: {
    type: String,
    default: process.env.TZ || DEFAULT_TIMEZONE,
    validate: {
      validator(v) {
        return !v || timezoneValidator(v);
      },
      message({ value }) {
        return `"${value}" seems to don't be a valid timezone`;
      },
    },
  },
}, { timestamps: true });

const campusFilter = (campus) => ({
  'roles.campuses._id': campus,
});

CampusSchema.statics.countUsers = async function countUsers(campus, filters = {}) {
  const User = mongoose.model(UserModelName);
  const f = { ...campusFilter(campus), ...filters };
  return User.countDocuments(f);
};

CampusSchema.statics.findUsers = async function findUsers(campus, pagination, filters = {}) {
  const User = mongoose.model(UserModelName);
  const f = { ...campusFilter(campus), ...filters };
  if (pagination) {
    return User.find(f).skip(pagination.offset).limit(pagination.limit);
  }
  return User.find(f);
};

CampusSchema.statics.findUser = async function findUser(campus, id, filters = {}) {
  const f = { _id: id, ...campusFilter(campus), ...filters };
  const User = mongoose.model(UserModelName);
  return User.findOne(f);
};

export default mongoose.model('Campus', CampusSchema, 'campuses');

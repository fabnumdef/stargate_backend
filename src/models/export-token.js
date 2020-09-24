import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;
const EXPORT_TOKEN_TTL = 3600;
export const EXPORT_FORMAT_CSV = 'CSV';
// @todo: export asynchronously
const ExportTokenSchema = new Schema({
  _id: {
    required: true,
    type: String,
  },
  modelName: {
    type: String,
  },
  filters: {
    type: Object,
    default: {},
  },
  projection: {
    type: Object,
    default: {},
  },
  format: {
    type: String,
    enum: [EXPORT_FORMAT_CSV],
  },
  options: {
    csv: {
      encoding: {
        type: String,
      },
      separator: {
        type: String,
      },
      quote: {
        type: String,
      },
      fields: {
        type: Array,
      },
    },
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

ExportTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

ExportTokenSchema.pre('validate', async function preSave() {
  if (!this._id) {
    this._id = uuidv4();
  }
  this.expiresAt = DateTime.local().plus({ seconds: EXPORT_TOKEN_TTL }).toJSDate();
});

ExportTokenSchema.loadClass(class ExportTokenClass {
  getDownloadLink({ host = '' } = {}) {
    return `//${host}/download/${this._id}`;
  }

  static async createCSVToken(Model, fields, filters = {}, projection = {}, {
    encoding = 'UTF-8',
    separator = ';',
    quote = '"',
  } = {}) {
    const token = new this({
      modelName: Model ? Model.modelName : null,
      filters,
      projection,
      format: EXPORT_FORMAT_CSV,
      options: {
        csv: {
          encoding,
          separator,
          quote,
          fields,
        },
      },
    });
    return token.save({ checkKeys: false });
  }
});

export default mongoose.model('ExportToken', ExportTokenSchema, 'export-tokens');

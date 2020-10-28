import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { EXPORT_TOKEN_TTL as DOWNLOAD_TOKEN_TTL } from './export-token';

const { Schema } = mongoose;

const DownloadTokenSchema = new Schema({
  _id: {
    required: true,
    type: String,
  },
  options: {
    file: {
      _id: Schema.ObjectId,
      bucketName: {
        type: String,
      },
    },
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

DownloadTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

DownloadTokenSchema.pre('validate', async function preSave() {
  if (!this._id) {
    this._id = uuidv4();
  }
  this.expiresAt = DateTime.local().plus({ seconds: DOWNLOAD_TOKEN_TTL }).toJSDate();
});

DownloadTokenSchema.loadClass(class DownloadTokenClass {
  getDownloadLink({ host = '' } = {}) {
    return `//${host}/download/${this._id}`;
  }

  static async createIdentityFileToken(bucketName, file) {
    const {
      mimetype,
      filename,
      _id,
    } = file;
    const token = new this({
      options: {
        file: {
          _id,
          filename,
          mimetype,
          bucketName,
        },
      },
    });
    return token.save({ checkKeys: false });
  }
});

export default mongoose.model('DownloadToken', DownloadTokenSchema, 'download-tokens');

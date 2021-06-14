import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

const OpenIDRequest = new Schema({
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  requestToken: {
    type: String,
    default: () => uuidv4(),
  },
  redirectURI: {
    type: String,
    required: true,
  },
}, { timestamps: true });

OpenIDRequest.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 3600 },
);

export default mongoose.model('OpenIDRequest', OpenIDRequest, 'openid-requests');

import mongoose from 'mongoose';

const { Schema } = mongoose;
export const MODEL_NAME = 'RequestCounter';

const RequestCountersSchema = new Schema({
  _id: String,
  seq: Number,
  shouldExpireAfter: Date,
});

RequestCountersSchema.index(
  { shouldExpireAfter: 1 },
  { expireAfterSeconds: 0 },
);

RequestCountersSchema.statics.getNextSequence = async function getNextSequence(campusId, luxonDate) {
  const shouldExpireAfter = luxonDate.plus({ days: 7 });
  const { seq } = await this.findOneAndUpdate(
    { _id: `${campusId}${luxonDate.toFormat('yyyyLLdd')}` },
    { $inc: { seq: 1 }, shouldExpireAfter: shouldExpireAfter.toJSDate() },
    {
      upsert: true,
      returnOriginal: false,
    },
  );
  return seq;
};

export default mongoose.model(MODEL_NAME, RequestCountersSchema, 'request-counters');

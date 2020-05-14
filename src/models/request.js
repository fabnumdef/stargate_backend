import mongoose from 'mongoose';
import {
  MODEL_NAME as UNIT_MODEL_NAME, WORKFLOW_ENUM,
} from './unit';
import {
  MODEL_NAME as VISITOR_MODEL_NAME,
} from './visitor';

const { Schema } = mongoose;
export const MODEL_NAME = 'Request';
export const ID_DOCUMENT_IDCARD = 'IDCard';
export const ID_DOCUMENT_PASSPORT = 'Passport';

const RequestSchema = new Schema({
  object: { type: String, required: true },
  reason: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  campus: {
    _id: { type: String, required: true },
    label: String,
  },
  owner: {
    _id: {
      type: Schema.ObjectId,
      required: true,
      alias: 'owner.id',
    },
    firstname: String,
    lastname: String,
    email: {
      original: String,
      canonical: String,
    },
  },
  places: [
    {
      _id: { type: Schema.ObjectId },
      label: { type: String, required: true },
      zone: {
        _id: { type: Schema.ObjectId },
        label: { type: String },
      },
      unitInCharge: {
        _id: { type: Schema.ObjectId },
        label: { type: String, required: true },
      },
    },
  ],
  units: [
    {
      _id: { type: Schema.ObjectId },
      label: { type: String, required: true },
      workflow: {
        steps: [
          {
            role: String,
            behavior: {
              type: String,
              enum: WORKFLOW_ENUM,
            },
          },
        ],
      },
    },
  ],
}, { timestamps: true });

RequestSchema.methods.cacheUnitsFromPlaces = async function cacheUnits(fetchInDatabase = false) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  this.units = this.places.map((p) => p.unitInCharge)
    .filter((unit, index, units) => units.findIndex((u) => u._id.equals(unit._id)) === index);
  if (fetchInDatabase) {
    this.units = await Unit.find({ _id: { $in: this.units.map((unit) => unit._id) } });
  }
  return this;
};

RequestSchema.methods.createVisitor = async function createVisitor(data) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const visitor = new Visitor(data);
  visitor.request = this;
  return visitor.save();
};

RequestSchema.methods.findVisitorByIdAndRemove = async function findVisitorByIdAndRemove(id) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.findOneAndRemove({ _id: id, 'request._id': this._id });
};

RequestSchema.methods.findVisitorsWithProjection = function findVisitorsWithProjection(filters, ...params) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.findWithProjection({ ...filters, 'request._id': this._id }, ...params);
};

RequestSchema.methods.countVisitors = async function countVisitors(filters) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.countDocuments({ ...filters, 'request._id': this._id });
};

export default mongoose.model(MODEL_NAME, RequestSchema, 'requests');

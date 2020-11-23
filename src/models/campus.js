import mongoose from 'mongoose';
import timezoneValidator from 'timezone-validator';
import {
  MODEL_NAME as UNIT_MODEL_NAME,
  WORKFLOW_BEHAVIOR_VALIDATION,
  WORKFLOW_DECISION_ACCEPTED, WORKFLOW_DECISION_NEGATIVE,
  WORKFLOW_DECISION_POSITIVE,
} from './unit';
import {
  MODEL_NAME as REQUEST_MODEL_NAME,
  STATE_CANCELED,
  STATE_CREATED,
  STATE_REJECTED,
} from './request';
import { MODEL_NAME as ZONE_MODEL_NAME } from './zone';
import { MODEL_NAME as PLACE_MODEL_NAME } from './place';
import { EXPORT_CSV_TEMPLATE_VISITORS, EXPORT_CSV_VISITORS, MODEL_NAME as VISITOR_MODEL_NAME } from './visitor';
import ExportToken from './export-token';
import config from '../services/config';

const DEFAULT_TIMEZONE = config.get('default_timezone');
const { Schema } = mongoose;

const CampusSchema = new Schema({
  _id: { type: String, alias: 'id' },
  label: { type: String, required: true },
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

CampusSchema.methods.createUnit = async function createUnit(data) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  const unit = new Unit(data);
  unit.campus = this;
  return unit.save();
};

CampusSchema.methods.createZone = async function createZone(data) {
  const Zone = mongoose.model(ZONE_MODEL_NAME);
  const zone = new Zone(data);
  zone.campus = this;
  return zone.save();
};

CampusSchema.methods.createPlaceFromGraphQLSchema = async function createPlace(data) {
  const Place = mongoose.model(PLACE_MODEL_NAME);
  const place = new Place();
  place.campus = this;
  await place.setFromGraphQLSchema(data);
  return place.save();
};

CampusSchema.methods.findUnitsWithProjection = function findUnitsWithProjection(filters, ...params) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  return Unit.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countUnits = async function countUnits(filters) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  return Unit.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findUnitbyId = async function findUnitbyId(id) {
  const Unit = mongoose.model(UNIT_MODEL_NAME);
  return Unit.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findZonesWithProjection = function findZonesWithProjection(filters, ...params) {
  const Zone = mongoose.model(ZONE_MODEL_NAME);
  return Zone.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countZones = async function countZones(filters) {
  const Zone = mongoose.model(ZONE_MODEL_NAME);
  return Zone.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findZonebyId = async function findZonebyId(id) {
  const Zone = mongoose.model(ZONE_MODEL_NAME);
  return Zone.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findPlacesWithProjection = function findPlacesWithProjection(filters, ...params) {
  const Place = mongoose.model(PLACE_MODEL_NAME);
  return Place.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countPlaces = async function countPlaces(filters) {
  const Place = mongoose.model(PLACE_MODEL_NAME);
  return Place.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findPlacebyId = async function findPlacebyId(id) {
  const Place = mongoose.model(PLACE_MODEL_NAME);
  return Place.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findPlacesbyId = async function findPlacesbyId(placesId) {
  const places = await Promise.all(placesId.map((placeId) => this.findPlacebyId(placeId)));
  return places;
};

CampusSchema.methods.findZoneByIdAndRemove = async function findZoneByIdAndRemove(id) {
  const Zone = mongoose.model(ZONE_MODEL_NAME);
  return Zone.findOneAndRemove({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.createRequest = async function createRequest(data) {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  const request = new Request(data);
  request.campus = this;
  // @todo : find a way to separate concerns here
  request.places = await this.findPlacesbyId(data.places);
  return request.save();
};

CampusSchema.methods.findRequestsWithProjection = function findRequestsWithProjection(filters, ...params) {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  return Request.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countRequests = async function countRequests(filters) {
  const Request = mongoose.model(REQUEST_MODEL_NAME);
  return Request.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findVisitorsWithProjection = function findVisitorsWithProjection(filters, ...params) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.findWithProjection({ ...filters, 'request.campus._id': this._id }, ...params);
};

CampusSchema.methods.countVisitors = async function countVisitors(filters) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  return Visitor.countDocuments({ ...filters, 'request.campus._id': this._id });
};

CampusSchema.methods.createCSVTokenForVisitors = async function createCSVTokenForVisitors(filters, options) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);
  const fields = EXPORT_CSV_VISITORS;
  const projection = Object.fromEntries(fields.map((f) => ([f.value, true])));
  return ExportToken.createCSVToken(
    Visitor,
    fields,
    { ...filters, 'request.campus._id': this._id },
    projection,
    options,
  );
};

CampusSchema.methods.createVisitorsTemplate = async function createVisitorsTemplate() {
  return ExportToken.createCSVToken(
    null,
    EXPORT_CSV_TEMPLATE_VISITORS.map((field) => ({ label: field.label, value: field.value })),
  );
};

CampusSchema.methods.findVisitorsToValidate = async function findVisitorsToValidate(
  { role, unit }, filters, offset, first,
) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);

  const stateValue = { 'workflow.steps': { $elemMatch: { role, 'state.value': { $exists: false } } } };
  const avoidRejected = {
    'workflow.steps': { $not: { $elemMatch: { behavior: WORKFLOW_BEHAVIOR_VALIDATION, 'state.isOK': false } } },
  };

  const notDoneFilter = {
    'request.units': unit
      ? { $elemMatch: { $and: [{ _id: mongoose.Types.ObjectId(unit) }, stateValue, avoidRejected] } }
      : { $elemMatch: { $and: [stateValue, avoidRejected] } },
    status: { $nin: [STATE_CANCELED] },
  };

  const nextStepsFilter = {
    $filter: {
      input: '$request.unitsToCheck.workflow.steps',
      as: 'step',
      cond: {
        $and: [
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_ACCEPTED] },
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_POSITIVE] },
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_NEGATIVE] },
        ],
      },
    },
  };

  const visitorsListTotal = Visitor.aggregate()
    .match(filters)
    .match(notDoneFilter)
    .addFields({
      'request.id': '$request._id',
      'request.unitsToCheck': '$request.units',
      'request.units':
        {
          $map:
            {
              input: '$request.units',
              as: 'unit',
              in: { id: { $toString: '$$unit._id' }, workflow: '$$unit.workflow', label: '$$unit.label' },
            },
        },
    })
    .unwind('request.unitsToCheck')
    .match(unit ? { 'request.unitsToCheck._id': mongoose.Types.ObjectId(unit) } : {})
    .addFields({ nextSteps: nextStepsFilter })
    .addFields({ nextStep: { $arrayElemAt: ['$nextSteps', 0] } })
    .match({ 'nextStep.role': role })
    .addFields({ id: '$_id' })
    .project({ _id: 0 });

  const paginateVisitors = async () => {
    const list = await visitorsListTotal
      .skip(offset)
      .limit(first);
    return list;
  };

  const countVisitors = await visitorsListTotal.exec();
  const visitorsListPaginated = await paginateVisitors();

  return { list: visitorsListPaginated, total: countVisitors.length };
};

// @todo delete method (and resolvers, schemas, test) when the front will display list of visitors instead of request
CampusSchema.methods.findRequestsByVisitorStatus = async function findRequestsByVisitorStatus(
  { role, unit }, isDone, filters, offset, first, sort,
) {
  const Visitor = mongoose.model(VISITOR_MODEL_NAME);

  const stateValue = { 'workflow.steps': { $elemMatch: { role, 'state.value': { $exists: false } } } };
  const avoidRejected = {
    'workflow.steps': { $not: { $elemMatch: { behavior: WORKFLOW_BEHAVIOR_VALIDATION, 'state.isOK': false } } },
  };

  const notDoneFilter = {
    'request.units': unit
      ? { $elemMatch: { $and: [{ _id: mongoose.Types.ObjectId(unit) }, stateValue, avoidRejected] } }
      : { $elemMatch: { $and: [stateValue, avoidRejected] } },
    status: { $nin: [STATE_CANCELED] },
  };

  const doneFilter = {
    $or: [
      { visitors: { $not: { $elemMatch: notDoneFilter } } },
      { 'requestData.status': { $in: [STATE_CANCELED, STATE_REJECTED] } },
    ],
  };

  const nextStepsFilter = {
    $filter: {
      input: '$request.units.workflow.steps',
      as: 'step',
      cond: {
        $and: [
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_ACCEPTED] },
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_POSITIVE] },
          { $ne: ['$$step.state.value', WORKFLOW_DECISION_NEGATIVE] },
        ],
      },
    },
  };

  let visitorAggregate = Visitor.aggregate()
    .match(unit ? { 'request.units._id': mongoose.Types.ObjectId(unit) } : {});

  const execVisitorAggregate = async () => {
    const result = await visitorAggregate
      .addFields({ id: '$_id' })
      .project({ _id: 0, 'visitors._id': 0, 'requestData._id': 0 })
      .skip(offset)
      .limit(first)
      .sort(sort);
    return result;
  };

  visitorAggregate = isDone.value
    ? visitorAggregate
      .addFields({ id: { $toString: '$_id' } })
      .group({ _id: '$request._id', visitors: { $push: '$$ROOT' } })
      .lookup({
        from: 'requests', localField: '_id', foreignField: '_id', as: 'requestData',
      })
      .match({ ...filters, ...doneFilter })
    : visitorAggregate
      .match(notDoneFilter)
      .unwind('$request.units')
      .match(unit ? { 'request.units._id': mongoose.Types.ObjectId(unit) } : {})
      .addFields({ nextSteps: nextStepsFilter })
      .addFields({ nextStep: { $arrayElemAt: ['$nextSteps', 0] } })
      .match({ 'nextStep.role': role })
      .group({ _id: '$request._id', visitors: { $push: '$$ROOT' } })
      .lookup({
        from: 'requests', localField: '_id', foreignField: '_id', as: 'requestData',
      })
      .match({ 'requestData.status': STATE_CREATED });

  const countRequests = await visitorAggregate.exec();
  const requests = await execVisitorAggregate();

  return {
    list: requests,
    total: countRequests.length,
  };
};

export default mongoose.model('Campus', CampusSchema, 'campuses');

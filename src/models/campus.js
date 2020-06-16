import mongoose from 'mongoose';
import timezoneValidator from 'timezone-validator';
import { MODEL_NAME as UnitModelName } from './unit';
import { MODEL_NAME as RequestModelName } from './request';
import { MODEL_NAME as ZoneModelName } from './zone';
import { MODEL_NAME as PlaceModelName } from './place';
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
  const Unit = mongoose.model(UnitModelName);
  const unit = new Unit(data);
  unit.campus = this;
  return unit.save();
};

CampusSchema.methods.createZone = async function createZone(data) {
  const Zone = mongoose.model(ZoneModelName);
  const zone = new Zone(data);
  zone.campus = this;
  return zone.save();
};

CampusSchema.methods.createPlaceFromGraphQLSchema = async function createPlace(data) {
  const Place = mongoose.model(PlaceModelName);
  const place = new Place();
  place.campus = this;
  await place.setFromGraphQLSchema(data);
  return place.save();
};

CampusSchema.methods.findUnitsWithProjection = function findUnitsWithProjection(filters, ...params) {
  const Unit = mongoose.model(UnitModelName);
  return Unit.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countUnits = async function countUnits(filters) {
  const Unit = mongoose.model(UnitModelName);
  return Unit.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findUnitbyId = async function findUnitbyId(id) {
  const Unit = mongoose.model(UnitModelName);
  return Unit.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findZonesWithProjection = function findZonesWithProjection(filters, ...params) {
  const Zone = mongoose.model(ZoneModelName);
  return Zone.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countZones = async function countZones(filters) {
  const Zone = mongoose.model(ZoneModelName);
  return Zone.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findZonebyId = async function findZonebyId(id) {
  const Zone = mongoose.model(ZoneModelName);
  return Zone.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findPlacesWithProjection = function findPlacesWithProjection(filters, ...params) {
  const Place = mongoose.model(PlaceModelName);
  return Place.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countPlaces = async function countPlaces(filters) {
  const Place = mongoose.model(PlaceModelName);
  return Place.countDocuments({ ...filters, 'campus._id': this._id });
};

CampusSchema.methods.findPlacebyId = async function findPlacebyId(id) {
  const Place = mongoose.model(PlaceModelName);
  return Place.findOne({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.findZoneByIdAndRemove = async function findZoneByIdAndRemove(id) {
  const Zone = mongoose.model(ZoneModelName);
  return Zone.findOneAndRemove({ _id: id, 'campus._id': this._id });
};

CampusSchema.methods.createRequest = async function createRequest(data) {
  const Request = mongoose.model(RequestModelName);
  const request = new Request(data);
  request.campus = this;
  // @todo : find a way to separate concerns here
  request.places = await Promise.all(data.places.map((placeId) => this.findPlacebyId(placeId)));
  return request.save();
};

CampusSchema.methods.findRequestsWithProjection = function findRequestsWithProjection(filters, ...params) {
  const Request = mongoose.model(RequestModelName);
  return Request.findWithProjection({ ...filters, 'campus._id': this._id }, ...params);
};

CampusSchema.methods.countRequests = async function countRequests(filters) {
  const Request = mongoose.model(RequestModelName);
  return Request.countDocuments({ ...filters, 'campus._id': this._id });
};

export default mongoose.model('Campus', CampusSchema, 'campuses');

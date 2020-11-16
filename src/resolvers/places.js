import Place from '../models/place';

export const CampusMutation = {
  async createPlace(campus, { place }) {
    return campus.createPlaceFromGraphQLSchema(place);
  },
  async editPlace(campus, { place, id }) {
    const c = await campus.findPlacebyId(id);
    await c.setFromGraphQLSchema(place);
    return c.save();
  },
  async deletePlace(campus, { id }) {
    const removedPlace = await Place.findByIdAndRemove(id);
    return removedPlace;
  },
};

const MAX_REQUESTABLE_PLACES = 30;
export const Campus = {
  async listPlaces(campus, {
    filters = {},
    cursor: { offset = 0, first = MAX_REQUESTABLE_PLACES } = {},
    hasUnit = {},
    sort = { label: 'asc' },
  }) {
    let unitInChargeFilter = {};
    if (hasUnit.id) {
      unitInChargeFilter = { 'unitInCharge._id': hasUnit.id };
    }
    return {
      campus,
      filters: { ...filters, ...unitInChargeFilter },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_PLACES) },
      countMethod: campus.countPlaces.bind(campus),
      sort,
    };
  },
  async getPlace(campus, { id }) {
    return campus.findPlacebyId(id);
  },
};

export const PlacesList = {
  async list({
    campus, filters, cursor: { offset, first }, sort,
  }, _params, _ctx, info) {
    return campus.findPlacesWithProjection(filters, info).sort(sort).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

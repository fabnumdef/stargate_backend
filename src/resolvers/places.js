export const CampusMutation = {
  async createPlace(campus, { place }) {
    return campus.createPlaceFromGraphQLSchema(place);
  },
  async editPlace(campus, { place, id }) {
    const c = await campus.findPlacebyId(id);
    await c.setFromGraphQLSchema(place);
    return c.save();
  },
};

const MAX_REQUESTABLE_PLACES = 30;
export const Campus = {
  async listPlaces(campus, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_PLACES } = {} }) {
    return {
      campus,
      filters,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_PLACES) },
      countMethod: campus.countPlaces.bind(campus),
    };
  },
  async getPlace(campus, { id }) {
    return campus.findPlacebyId(id);
  },
};

export const PlacesList = {
  async list({ campus, filters, cursor: { offset, first } }, _params, _ctx, info) {
    return campus.findPlacesWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

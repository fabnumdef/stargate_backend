export const CampusMutation = {
  async createZone(campus, { zone }) {
    return campus.createZone(zone);
  },
  async editZone(campus, { zone, id }) {
    const c = await campus.findZonebyId(id);
    c.set(zone);
    return c.save();
  },
  async deleteZone(campus, { id }) {
    const removedZone = await campus.findZoneByIdAndRemove(id);
    if (!removedZone) {
      throw new Error('Error - Zone not found');
    }
    return removedZone;
  },
};

const MAX_REQUESTABLE_ZONES = 30;
export const Campus = {
  async listZones(campus, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_ZONES } = {} }) {
    return {
      campus,
      filters,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_ZONES) },
      countMethod: campus.countZones.bind(campus),
    };
  },
  async getZone(campus, { id }) {
    return campus.findZonebyId(id);
  },
};

export const ZonesList = {
  async list({ campus, filters, cursor: { offset, first } }, _params, _ctx, info) {
    return campus.findZonesWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

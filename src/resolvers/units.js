import Unit from '../models/unit';

export const CampusMutation = {
  async createUnit(campus, { unit }) {
    return campus.createUnit(unit);
  },
  async editUnit(campus, { unit, id }) {
    const c = await Unit.findById(id);
    c.set(unit);
    return c.save();
  },
  async deleteUnit(campus, { id }) {
    const removedUnit = await Unit.findByIdAndRemove(id);
    if (!removedUnit) {
      throw new Error('Unit not found');
    }
    await removedUnit.deleteUnitDependencies();
    return removedUnit;
  },
};

const MAX_REQUESTABLE_UNITS = 30;
export const Campus = {
  async listUnits(campus, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_UNITS } = {} }) {
    return {
      campus,
      filters,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_UNITS) },
      countMethod: campus.countUnits.bind(campus),
    };
  },
  async getUnit(_parent, { id }, _ctx, info) {
    return Unit.findByIdWithProjection(id, info);
  },
};

export const UnitsList = {
  async list({ campus, filters, cursor: { offset, first } }, _params, _ctx, info) {
    return campus.findUnitsWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

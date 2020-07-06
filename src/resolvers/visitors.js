import Visitor from '../models/visitor';

export const RequestMutation = {
  async createVisitor(request, { visitor }) {
    return request.createVisitor(visitor);
  },
  async editVisitor(request, { visitor, id }) {
    const v = await Visitor.findById(id);
    if (!v) {
      throw new Error('Visitor not found');
    }
    v.set(visitor);
    return v.save();
  },

  async deleteVisitor(request, { id }) {
    const removedVisitor = await request.findVisitorByIdAndRemove(id);
    if (!removedVisitor) {
      throw new Error('Visitor not found');
    }
    return removedVisitor;
  },

  async shiftVisitor(request, {
    id, as: { unit, role } = {}, transition, tags = [],
  }) {
    const v = await Visitor.findById(id);
    if (!v) {
      throw new Error('Visitor not found');
    }
    const step = v.getStep(unit, role);
    const predicatedEvent = v.predicateEvent(unit, step._id, transition);
    const possibleEvents = v.listPossibleEvents();
    if (possibleEvents.indexOf(predicatedEvent) === -1) {
      throw new Error('You cannot shift to this state');
    }
    await v.stateMutation(unit, step._id, transition, tags);
    return v.save();
  },
};

const MAX_REQUESTABLE_VISITS = 30;

export const Campus = {
  async listVisitors(campus, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {}, search }) {
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    return {
      campus,
      filters: { ...filters, ...searchFilters },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_VISITS) },
      countMethod: campus.countVisitors.bind(campus),
    };
  },
};

export const Request = {
  async listVisitors(request, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {}, search }) {
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    return {
      request,
      filters: { ...filters, ...searchFilters },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_VISITS) },
      countMethod: request.countVisitors.bind(request),
    };
  },
  async getVisitor(_parent, { id }, _ctx, info) {
    const v = await Visitor.findByIdWithProjection(id, info);
    if (!v) {
      throw new Error('Visitor not found');
    }
    return v;
  },
};

export const RequestVisitor = {
  async status(visitor) {
    return Object.values(visitor.status).map(({ _id, label, ...steps }) => ({ unitId: _id, label, steps }));
  },
};

export const UnitStatus = {
  async steps({ steps }) {
    return Object.values(steps)
      .map((s) => (s.toObject ? s.toObject() : s))
      .map(({ _id, ...other }) => ({ step: _id, ...other }));
  },
};

export const RequestVisitorsList = {
  async list({
    campus, request = campus, filters, cursor: { offset, first },
  }, _params, _ctx, info) {
    return request.findVisitorsWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

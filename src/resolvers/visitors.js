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
};

const MAX_REQUESTABLE_VISITS = 30;
export const Request = {
  async listVisitors(request, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {} }) {
    return {
      request,
      filters,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_VISITS) },
      countMethod: request.countVisitors.bind(request),
    };
  },
  async getVisitor(_parent, { id }, _ctx, info) {
    return Visitor.findByIdWithProjection(id, info);
  },
};

export const RequestVisitorsList = {
  async list({ request, filters, cursor: { offset, first } }, _params, _ctx, info) {
    return request.findVisitorsWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

import Request from '../models/request';

export const CampusMutation = {
  async createRequest(campus, { request }, { user }) {
    return campus.createRequest(Object.assign(request, { owner: user }));
  },
  async editRequest(campus, { request, id }) {
    const r = await Request.findById(id);
    r.set(request);
    return r.save();
  },
  async mutateRequest(_, { id }) {
    return Request.findById(id);
  },
};

export const RequestMutation = {
  async addVisitor(request, { visitor }) {
    return request.addVisitor(visitor);
  },
};

export const Campus = {
  async getRequest(_parent, { id }, _ctx, info) {
    return Request.findByIdWithProjection(id, info);
  },
};

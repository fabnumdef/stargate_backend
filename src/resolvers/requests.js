import RequestModel from '../models/request';

export const CampusMutation = {
  async createRequest(campus, { request }, { user }) {
    return campus.createRequest(Object.assign(request, { owner: user }));
  },
  async editRequest(campus, { request, id }) {
    const r = await RequestModel.findById(id);
    r.set(request);
    return r.save();
  },
  async mutateRequest(_, { id }) {
    return RequestModel.findById(id);
  },
};

export const Campus = {
  async getRequest(_parent, { id }) {
    return RequestModel.findById(id);
  },
};

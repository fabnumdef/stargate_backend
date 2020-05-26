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
  async deleteRequest(campus, { id }) {
    const removedRequest = await RequestModel.findByIdAndRemove(id);
    if (!removedRequest) {
      throw new Error('Request not found');
    }
    return removedRequest;
  },
  async mutateRequest(_, { id }) {
    const request = await RequestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  },
};

export const Campus = {
  async getRequest(_parent, { id }) {
    const request = await RequestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  },
};

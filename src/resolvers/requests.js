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
    return RequestModel.findById(id);
  },
  async shiftRequest(request, { id, transition }) {
    const r = await RequestModel.findById(id);
    if (!r) {
      throw new Error('Request not found');
    }
    const possibleEvents = r.listPossibleEvents();
    if (possibleEvents.indexOf(transition) === -1) {
      throw new Error('You cannot shift to this state');
    }
    await r.stateMutation(transition);
    return r.save();
  },

};

export const Campus = {
  async getRequest(_parent, { id }) {
    return RequestModel.findById(id);
  },
};

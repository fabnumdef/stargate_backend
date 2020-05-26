import RequestModel, { EVENT_REMOVE, STATE_REMOVED } from '../models/request';

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
    const r = await RequestModel.findById(id);
    if (!r) {
      throw new Error('Request not found');
    }
    const possibleEvents = r.listPossibleEvents();
    if (possibleEvents.indexOf(EVENT_REMOVE) === -1) {
      throw new Error('You cannot shift to this state');
    }
    await r.stateMutation(EVENT_REMOVE);
    return r;
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
    return r.status === STATE_REMOVED ? r : r.save();
  },

};

export const Campus = {
  async getRequest(_parent, { id }) {
    return RequestModel.findById(id);
  },
};

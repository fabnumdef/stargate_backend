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
    const request = await RequestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
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

const MAX_REQUESTABLE_REQUESTS = 10;
export const Campus = {
  async getRequest(_parent, { id }) {
    const request = await RequestModel.findById(id);
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  },
  async listRequests(campus, { as, filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_REQUESTS } = {} }) {
    return {
      campus,
      filters,
      as,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_REQUESTS) },
      countMethod: campus.countRequests.bind(campus, { 'units.label': as.unit }),
    };
  },
};

export const RequestsList = {
  async list(
    {
      campus, filters, as, cursor: { offset, first },
    },
    _params,
    _ctx,
    info,
  ) {
    return campus.findRequestsWithProjection(filters, as, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

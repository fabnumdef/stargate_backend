import mongoose from 'mongoose';
import RequestModel, { EVENT_REMOVE, STATE_REMOVED } from '../models/request';
import { ROLE_SECURITY_OFFICER, ROLE_UNIT_CORRESPONDENT } from '../models/rules';

export const CampusMutation = {
  async createRequest(campus, { request, ownerData }, { user }) {
    return campus.createRequest(Object.assign(
      request,
      { owner: { ...user, unit: { _id: ownerData.unitId, label: ownerData.unitLabel }, role: ownerData.role } },
    ));
  },
  async editRequest(campus, { request, id }) {
    const r = await RequestModel.findById(id);
    if (request.places) {
      request.places = await campus.findPlacesbyId(request.places);
    }
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
  async listRequests(campus, {
    as,
    filters = {},
    cursor: { offset = 0, first = MAX_REQUESTABLE_REQUESTS } = {},
    search,
    sort = { from: 'ascending' },
  }) {
    const roleFilters = { 'units.workflow.steps.role': as.role };
    const unitFilters = [ROLE_SECURITY_OFFICER, ROLE_UNIT_CORRESPONDENT].includes(as.role)
      ? { 'units.label': as.unit }
      : {};
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    return {
      campus,
      filters: {
        ...filters, ...roleFilters, ...unitFilters, ...searchFilters,
      },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_REQUESTS) },
      countMethod: campus.countRequests.bind(campus, {
        ...filters, ...roleFilters, ...unitFilters, ...searchFilters,
      }),
      sort,
    };
  },
  async listMyRequests(
    campus,
    {
      filters = {},
      cursor: { offset = 0, first = MAX_REQUESTABLE_REQUESTS } = {},
      search,
      sort = { from: 'ascending' },
    },
    { user },
  ) {
    const userFilters = {
      ...filters,
      'owner._id': mongoose.Types.ObjectId(user.id),
    };
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    return {
      campus,
      filters: { ...userFilters, ...searchFilters },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_REQUESTS) },
      countMethod: campus.countRequests.bind(campus, { ...userFilters, ...searchFilters }),
      sort,
    };
  },
};

export const RequestsList = {
  async list(
    {
      campus, filters, cursor: { offset, first }, sort,
    },
    _params,
    _ctx,
    info,
  ) {
    return campus.findRequestsWithProjection(filters, info).skip(offset).limit(first).sort(sort);
  },
  meta: (parent) => parent,
};

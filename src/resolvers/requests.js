import Request from '../models/request';

export const CampusMutation = {
  async createRequest(campus, { request }) {
    return campus.createRequest(request);
  },
};

export const Campus = {
  async getRequest(_parent, { id }, _ctx, info) {
    return Request.findByIdWithProjection(id, info);
  },
};

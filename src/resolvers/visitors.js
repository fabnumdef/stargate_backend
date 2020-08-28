import Visitor, { GLOBAL_VALIDATION_ROLES } from '../models/visitor';

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

  async validateVisitorStep(request, {
    id, as: { unit, role } = {}, decision, tags = [],
  }) {
    const v = await Visitor.findById(id);
    if (!v) {
      throw new Error('Visitor not found');
    }
    // @todo: refactor this as a cache system + auto validation, to put time guards
    if (GLOBAL_VALIDATION_ROLES.includes(role)) {
      await Promise.all(v.request.units.map(
        (u) => {
          if (u.workflow.steps.find((s) => s.role === role)) {
            v.validateStep(u._id.toString(), role, decision, tags);
          }
          return u;
        },
      ));
    } else {
      await v.validateStep(unit, role, decision, tags);
    }
    return v.save();
  },
};

const MAX_REQUESTABLE_VISITS = 30;

export const Campus = {
  async listVisitors(campus, {
    filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {}, search, isDone = null, requestsId,
  }) {
    let isDoneFilters = {};
    if (isDone) {
      isDoneFilters = {
        'request.units.workflow.steps': {
          $elemMatch: {
            role: isDone.role,
            'state.value': { $exists: isDone.value },
          },
        },
      };
    }
    let requestsFilters = {};
    if (requestsId) {
      requestsFilters = { 'request._id': requestsId };
    }
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    return {
      campus,
      filters: {
        ...filters,
        ...searchFilters,
        ...isDoneFilters,
        ...requestsFilters,
      },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_VISITS) },
      countMethod: campus.countVisitors.bind(campus),
    };
  },
  async listRequestByVisitorStatus(
    campus,
    {
      filters = {}, as, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {}, isDone,
    },
  ) {
    const requests = await campus.findRequestsByVisitorStatus(as, isDone, filters, offset, first);

    return {
      list: requests.list,
      meta: {
        cursor: { offset, first },
        countMethod: () => requests.total,
      },
    };
  },
};

export const Request = {
  async listVisitors(request, {
    filters = {},
    cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {},
    search, isDone = null,
  }) {
    const searchFilters = {};
    if (search) {
      searchFilters.$text = { $search: search };
    }
    let isDoneFilters = {};
    if (isDone) {
      isDoneFilters = {
        'request.units.workflow.steps': {
          $elemMatch: {
            role: isDone.role,
            'state.value': { $exists: isDone.value },
          },
        },
      };
    }
    return {
      request,
      filters: { ...filters, ...searchFilters, ...isDoneFilters },
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
  units(visitor) {
    return visitor.request.units;
  },
};

export const RequestVisitorUnits = {
  steps(unit) {
    return unit.workflow.steps;
  },
};

export const RequestVisitorsList = {
  async list({
    campus, request = campus, filters, cursor: { offset, first },
  }, _params, _ctx, info) {
    return request.findVisitorsWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
  generateCSVExportLink({
    campus, filters, request = campus,
  }, { options }) {
    return request.createCSVTokenForVisitors(filters, options);
  },
};

export const RequestVisitorUnitsStepsState = {
  tags(state) {
    return state.payload.tags;
  },
};

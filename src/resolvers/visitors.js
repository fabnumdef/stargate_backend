import csv from 'csv-parser';
import mongoose from 'mongoose';
import { deleteUploadedFile } from '../models/helpers/upload';
import Visitor, { GLOBAL_VALIDATION_ROLES, FIELDS_TO_SEARCH, BUCKETNAME_VISITOR_FILE } from '../models/visitor';
import {
  STATE_ACCEPTED,
  STATE_CREATED,
  STATE_MIXED,
  STATE_REJECTED,
  STATE_CANCELED,
} from '../models/request';
import { WORKFLOW_BEHAVIOR_VALIDATION } from '../models/unit';
import DownloadToken from '../models/download-token';

export const RequestMutation = {
  async createVisitor(request, { visitor, as }) {
    let datas = visitor;
    if (visitor.file) {
      const file = await request.uploadVisitorIdFile(visitor, BUCKETNAME_VISITOR_FILE);
      if (file === 'File upload error') {
        throw new Error('File upload error');
      }
      datas = {
        ...visitor,
        identityDocuments: visitor.identityDocuments.map((docs) => ({ ...docs, file })),
      };
    }
    return request.createVisitor(datas, as.role);
  },
  async createGroupVisitors(request, { file, as }) {
    await Visitor.deleteMany({ 'request._id': request.id });
    const { createReadStream } = await file.file;
    const visitors = await new Promise((resolve) => {
      const result = [];
      createReadStream()
        .pipe(csv({
          separator: ';',
          quote: '"',
        }))
        .on('data', (row) => {
          result.push(row);
        })
        .on('end', async () => resolve(await request.createGroupVisitors(result, as.role)));
    });
    return visitors;
  },
  async editVisitor(request, { visitor, id }) {
    let datas = visitor;
    const v = await Visitor.findById(id);
    if (!v) {
      throw new Error('Visitor not found');
    }
    if (visitor.file && visitor.file[0]) {
      if (v.identityDocuments.length) {
        await deleteUploadedFile(v.identityDocuments[0].file._id, BUCKETNAME_VISITOR_FILE);
      }
      const file = await request.uploadVisitorIdFile(visitor, BUCKETNAME_VISITOR_FILE);
      if (file === 'File upload error') {
        throw new Error('File upload error');
      }
      datas = {
        ...visitor,
        identityDocuments: visitor.identityDocuments.map((docs) => ({ ...docs, file })),
      };
    } else {
      datas = {
        ...visitor,
        identityDocuments: v.identityDocuments.map((docs) => {
          if (docs.kind === visitor.identityDocuments[0].kind) {
            deleteUploadedFile(docs.file.id, BUCKETNAME_VISITOR_FILE);
            return visitor.identityDocuments[0];
          }
          return docs;
        }),
      };
    }

    v.set(datas);
    return v.save();
  },

  async deleteVisitor(request, { id }) {
    const removedVisitor = await request.findVisitorByIdAndRemove(id);
    if (!removedVisitor) {
      throw new Error('Visitor not found');
    }
    await Promise.all(removedVisitor.identityDocuments.map((doc) => {
      if (doc.file) {
        return deleteUploadedFile(doc.file.id, BUCKETNAME_VISITOR_FILE);
      }
      return null;
    }));
    return removedVisitor;
  },

  async cancelVisitor(request, { id }, ctx) {
    const { id: userId } = ctx.user;
    if (userId !== request.owner._id.toString()) {
      throw new Error('Only the owner can cancel a visitor');
    }
    const v = await Visitor.findById(id);
    if (!v) {
      throw new Error('Visitor not found');
    }
    await v.cancelVisitor();
    return v.save();
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
          if (u.workflow.steps.find((s) => s.behavior === WORKFLOW_BEHAVIOR_VALIDATION && s.state.isOK === false)) {
            return u;
          }
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

const MAX_REQUESTABLE_VISITS = 50;

export const Campus = {
  async listVisitors(campus, {
    filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {}, search, isDone = null, visitorsId,
  }) {
    let isDoneFilters = {};
    if (isDone) {
      isDoneFilters = {
        'request.units': {
          $elemMatch: {
            _id: isDone.unit ? mongoose.Types.ObjectId(isDone.unit) : { $exists: true },
            'workflow.steps': {
              $elemMatch: {
                role: isDone.role,
                'state.value': { $exists: isDone.value },
              },
            },
          },
        },
      };
    }
    let visitorsFilters = {};
    if (visitorsId) {
      visitorsFilters = { _id: visitorsId };
    }
    let searchFilters = {};
    if (search) {
      searchFilters = { $or: FIELDS_TO_SEARCH.map((field) => ({ [field]: { $regex: search, $options: 'i' } })) };
    }
    return {
      campus,
      filters: {
        ...filters,
        ...searchFilters,
        ...isDoneFilters,
        ...visitorsFilters,
      },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_VISITS) },
      countMethod: campus.countVisitors.bind(campus),
    };
  },
  async listVisitorsToValidate(
    campus,
    {
      filters = {},
      as,
      cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {},
      search = {},
    },
  ) {
    const visitors = await campus.findVisitorsToValidate(as, filters, offset, first, search);
    return {
      list: visitors.list,
      meta: {
        cursor: { offset, first },
        countMethod: () => visitors.total,
      },
    };
  },
  async listRequestByVisitorStatus(
    campus,
    {
      filters = {},
      as,
      cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {},
      isDone,
      sort = { 'requestData.from': 'asc' },
    },
  ) {
    const requests = await campus.findRequestsByVisitorStatus(as, isDone, filters, offset, first, sort);

    return {
      list: requests.list,
      meta: {
        cursor: { offset, first },
        countMethod: () => requests.total,
      },
    };
  },
  async getVisitorsTemplate(campus) {
    return campus.createVisitorsTemplate();
  },
};

export const CampusMutation = {
  async generateCSVExportLink(campus, { visitorsId, options }) {
    return campus.createCSVTokenForVisitors({ _id: visitorsId }, options);
  },
};

export const Request = {
  async listVisitors(request, {
    filters = {},
    cursor: { offset = 0, first = MAX_REQUESTABLE_VISITS } = {},
    search, isDone = null,
  }) {
    let searchFilters = {};
    if (search) {
      searchFilters = { $or: FIELDS_TO_SEARCH.map((field) => ({ [field]: { $regex: search, $options: 'i' } })) };
    }
    let isDoneFilters = {};
    if (isDone) {
      isDoneFilters = {
        status: isDone.value ? [STATE_REJECTED, STATE_ACCEPTED, STATE_MIXED, STATE_CANCELED] : STATE_CREATED,
        'request.units.workflow.steps': { $elemMatch: { role: isDone.role, 'state.value': { $exists: isDone.value } } },
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
  generateIdentityFileExportLink(visitor) {
    return visitor.identityDocuments[0].file
      ? DownloadToken.createIdentityFileToken(BUCKETNAME_VISITOR_FILE, visitor.identityDocuments[0].file)
      : null;
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
};

export const RequestVisitorUnitsStepsState = {
  tags(state) {
    return state.payload.tags;
  },
};

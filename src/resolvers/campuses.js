import Campus from '../models/campus';

export const Mutation = {
    async createCampus(_, { campus }) {
        return Campus.create(campus);
    },
    async editCampus(_, { campus, id}) {
        const c = await Campus.findById(id);
        c.set(campus);
        return c.save();
    }
};

const MAX_REQUESTABLE_CAMPUSES = 30;
export const Query = {
    async listCampuses(_parent, {filters = {}, cursor: {offset = 0, first = MAX_REQUESTABLE_CAMPUSES} = {}}, _ctx, info) {
        return {
            filters,
            cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_CAMPUSES) },
            Model: Campus,
        };
    },
    async getCampus(_parent, {id}, _ctx, info) {
        return Campus.findByIdWithProjection(id, info);
    }
};

export const CampusesList = {
    async list({filters, cursor: {offset, first} = {}}, _params, _ctx, info) {
        return Campus.findWithProjection(filters, info).skip(offset).limit(first);
    },
    meta: (parent) => parent,
};
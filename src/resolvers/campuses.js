import Campus from '../models/campus';

export const Mutation = {
    async createCampus(_, { campus }) {
        // @todo test rights
        return Campus.create(campus);
    },
    async editCampus(_, { campus, id}) {
        // @todo test rights
        const c = await Campus.findById(id);
        c.set(campus);
        return c.save();
    }
};

export const Query = {
    async listCampuses() {
        // @todo handle offset position
        // @todo handle filters
        // @todo test rights
        // @todo lazy loading fields in the find query
        // @todo lazy triggering queries on demand
        return {
            list: await Campus.find(),
            meta: {
                total: await Campus.count(),
            }
        };
    },
    async getCampus(_, {id}) {
        // @todo test rights
        return Campus.findById(id);
    }
}
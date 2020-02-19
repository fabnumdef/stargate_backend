import User, {ExpiredPasswordError} from '../models/user';

export const Mutation = {
    async createUser(_, { user: data }) {
        const user = new User();
        user.setFromGraphQLSchema(data);
        await user.save();
        return user;
    },

    async editUser(_, { user: data, id}) {
        // @todo test rights
        const user = await User.findById(id);
        user.setFromGraphQLSchema(data);
        return user.save();
    },

    async login(_, { email, password }) {
        const user = await User.findByEmail(email);

        if (!password) {
            throw new Error('To generate a JWT, password is required.');
        }

        if (!user
            || !(await user.comparePassword(password))
        ) {
            throw new Error(`Email "${email}" and password do not match.`);
        }

        if (user.hasPasswordExpired()) {
            throw new Error('Password expired');
        }

        return {user};
    }
};

export const RequestableTokens = {
    async jwt({ user }) {
        return user.emitJWT();
    },
};

export const Query = {
    async listUsers() {
        // @todo handle offset position
        // @todo handle filters
        // @todo test rights
        // @todo lazy loading fields in the find query
        // @todo lazy triggering queries on demand
        return {
            list: await User.find(),
            meta: {
                total: await User.count(),
            }
        };
    },
    async getUser(_, { id }) {
        // @todo test rights
        return User.findById(id);
    }
}
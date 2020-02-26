import User from '../models/user';

export const Mutation = {
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

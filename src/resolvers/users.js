import User from '../models/user';

export const Mutation = {
  async createUser(_, { user: data }) {
    const user = new User();
    user.setFromGraphQLSchema(data);
    await user.save();
    return user;
  },
  async editUser(_, { user: data, id }) {
    const user = await User.findById(id);
    user.setFromGraphQLSchema(data);
    return user.save();
  },
  async deleteUser(_, { id }) {
    const removedUser = await User.findByIdAndRemove(id);
    if (!removedUser) {
      throw new Error('User not found');
    }
    return removedUser;
  },
  async resetPassword(_, { email }) {
    const userExists = await User.findByEmail(email);
    if (!userExists) {
      return true;
    }
    const { token } = await userExists.generateResetToken({ email });
    await userExists.save();

    await userExists.sendResetPasswordMail(token);
    return true;
  },
};

const MAX_REQUESTABLE_USERS = 30;
export const Query = {
  async listUsers(_parent, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_USERS } = {} }) {
    return {
      filters,
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_USERS) },
      countMethod: User.countDocuments.bind(User),
    };
  },
  async getUser(_parent, { id }, _ctx, info) {
    return User.findByIdWithProjection(id, info);
  },
};

export const UsersList = {
  async list({ filters, cursor: { offset, first } }, _params, _ctx, info) {
    return User.findWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

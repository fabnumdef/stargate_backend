import User from '../models/user';

export const Mutation = {
  async createUser(_, { user: data }) {
    const userExists = await User.findByEmail(data.email);
    if (userExists) {
      throw new Error('User already exists');
    }
    const user = new User();
    user.setFromGraphQLSchema(data);
    await user.save();

    const { token } = await user.generateResetToken({ email: data.email.original });
    await user.save();

    await user.sendCreateUserMail(token);

    return user;
  },
  async editUser(_, { user: data, id }) {
    const user = await User.findById(id);
    await user.setFromGraphQLSchema(data);
    return user.save();
  },
  async deleteUserRole(_, { user: data, id }) {
    const user = await User.findById(id);
    const roles = user.roles.filter((userRole) => !data.roles.find((r) => r.role === userRole.role));
    user.set({ roles });
    return user.save();
  },
  async editMe(_, { user: data }, ctx) {
    const { id } = ctx.user;
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
  async listUsers(_parent, { filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_USERS } = {}, hasRole }) {
    let roleFilter = {};
    if (hasRole) {
      roleFilter = { 'roles.role': hasRole }
    }
    return {
      filters: { ...filters, ...roleFilter },
      cursor: { offset, first: Math.min(first, MAX_REQUESTABLE_USERS) },
      countMethod: User.countDocuments.bind(User),
    };
  },
  async getUser(_parent, { id }, _ctx, info) {
    return User.findByIdWithProjection(id, info);
  },
  async me(_parent, _, ctx, info) {
    const { id } = ctx.user;
    return User.findByIdWithProjection(id, info);
  },
};

export const UsersList = {
  async list({ filters, cursor: { offset, first } }, _params, _ctx, info) {
    return User.findWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

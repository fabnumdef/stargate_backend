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
  async addUserRole(_, { roleData: data, id }) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.addUserRole(data);
    return user;
  },
  async deleteUserRole(_, { roleData: data, id }) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.deleteUserRole(data);
    return user;
  },
  async editMe(_, { user: data, currentPassword }, ctx) {
    const { id } = ctx.user;
    const user = await User.findById(id);
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw new Error('Invalid password');
    }
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

  async sendResetPassword(_, { email }) {
    const userExists = await User.findByEmail(email);
    if (!userExists) {
      return true;
    }
    const { token } = await userExists.generateResetToken({ email });
    await userExists.save();

    await userExists.sendResetPasswordMail(token);
    return true;
  },

  async resetPassword(_, { email, token, password }) {
    const user = await User.findByEmail(email);
    if (!user) {
      return true;
    }
    if (!(await user.compareResetToken(token, email))) {
      throw new Error('Expired link');
    }
    user.password = password;
    await user.save();

    return true;
  },
};

const MAX_REQUESTABLE_USERS = 50;
export const Query = {
  async listUsers(_parent, {
    filters = {}, cursor: { offset = 0, first = MAX_REQUESTABLE_USERS } = {}, hasRole = {}, campus = null, search,
  }) {
    const campusFilter = campus ? { 'roles.campuses._id': campus } : {};
    let roleFilter = {};
    if (hasRole.role) {
      roleFilter = {
        'roles.role': hasRole.role,
      };
    }
    if (hasRole.unit) {
      roleFilter = {
        ...roleFilter,
        'roles.units._id': hasRole.unit,
      };
    }
    let searchFilters = {};
    if (search) {
      searchFilters = { $or: [{ lastname: { $regex: search, $options: 'i' } }] };
    }
    return {
      filters: {
        ...filters, ...roleFilter, ...searchFilters, ...campusFilter,
      },
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
  async findUser(_, { email }) {
    return User.findByEmail(email);
  },
};

export const UsersList = {
  async list({ filters, cursor: { offset, first } }, _params, _ctx, info) {
    return User.findWithProjection(filters, info).skip(offset).limit(first);
  },
  meta: (parent) => parent,
};

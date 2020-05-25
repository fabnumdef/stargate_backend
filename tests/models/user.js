import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import User from '../../src/models/user';
import { ROLE_SUPERADMIN, ROLE_ADMIN } from '../../src/models/rules';
import config from '../../src/services/config';

const { Types: { ObjectId } } = mongoose;

export const generateDummyUser = (params) => {
  config.set('mail:whitelist_domains', ['']);
  return {
    _id: new ObjectId(),
    firstname: nanoid(),
    lastname: nanoid(),
    email: {
      original: `${nanoid()}@localhost`,
    },
    password: nanoid(),
    createdAt: new Date(),
    tokens: [],
    ...params,
  };
};

export const generateDummySuperAdmin = (params) => generateDummyUser({
  ...params,
  roles: [
    { role: ROLE_SUPERADMIN },
  ],
});

export const generateDummyAdmin = (params) => generateDummyUser({
  ...params,
  roles: [
    { role: ROLE_ADMIN },
  ],
});

export const createDummyUser = async (params) => {
  const dummyUser = generateDummyUser(params);
  return User.create(dummyUser);
};

export default User;

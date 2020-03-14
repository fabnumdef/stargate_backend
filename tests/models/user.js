import mongoose from 'mongoose';
import nanoid from 'nanoid';
import User from '../../src/models/user';
import { ROLE_SUPERADMIN } from '../../src/models/rules';
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
    ...params,
  };
};

export const generateDummySuperAdmin = (params) => generateDummyUser({
  ...params,
  roles: [
    { role: ROLE_SUPERADMIN },
  ],
});

export const createDummyUser = async (params) => {
  const dummyCampus = generateDummyUser(params);
  return User.create(dummyCampus);
};

export default User;

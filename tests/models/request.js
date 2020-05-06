import { nanoid } from 'nanoid';
import Request from '../../src/models/request';

export const generateDummyRequest = (...params) => ({
  from: new Date(),
  to: new Date(),
  reason: nanoid(),
  object: 'PRIVATE',
  places: [],
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export const createDummyRequest = async (...params) => {
  const dummyRequest = generateDummyRequest(...params);
  return Request.create(dummyRequest);
};

export const generateDummyVisitor = (...params) => ({
  firstname: nanoid(),
  usageLastname: nanoid(),
  email: `${nanoid()}@localhost`,
  birthLastname: nanoid(),
  nationality: nanoid(),
  birthday: new Date(),
  birthplace: nanoid(),
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export default Request;

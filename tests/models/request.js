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

export default Request;

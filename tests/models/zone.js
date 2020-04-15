import { nanoid } from 'nanoid';
import Zone from '../../src/models/zone';

export const generateDummyZone = (...params) => ({
  label: nanoid(),
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export const createDummyZone = async (...params) => {
  const dummyZone = generateDummyZone(...params);
  return Zone.create(dummyZone);
};

export default Zone;

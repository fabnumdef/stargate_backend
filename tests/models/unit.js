import { nanoid } from 'nanoid';
import Unit from '../../src/models/unit';

export const generateDummyUnit = (...params) => ({
  label: nanoid(),
  trigram: nanoid(3),
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export const createDummyUnit = async (...params) => {
  const dummyUnit = generateDummyUnit(...params);
  return Unit.create(dummyUnit);
};

export default Unit;

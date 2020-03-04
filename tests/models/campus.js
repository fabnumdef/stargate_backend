import nanoid from 'nanoid';
import Campus from '../../src/models/campus';

export const generateDummyCampus = (...params) => ({
  _id: nanoid(),
  label: nanoid(),
  ...params,
});

export const createDummyCampus = async (...params) => {
  const dummyCampus = generateDummyCampus(...params);
  return Campus.create(dummyCampus);
};

export default Campus;

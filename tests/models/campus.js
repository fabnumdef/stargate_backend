import { nanoid } from 'nanoid';
import Campus from '../../src/models/campus';

export const generateDummyCampus = (params) => ({
  _id: nanoid(),
  label: nanoid(),
  trigram: nanoid(3),
  ...params,
});

export const createDummyCampus = async (params) => {
  const dummyCampus = generateDummyCampus(params);
  return Campus.create(dummyCampus);
};

export default Campus;

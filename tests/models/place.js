import nanoid from 'nanoid';
import Place from '../../src/models/place';

export const generateDummyPlace = (...params) => ({
  label: nanoid(),
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export const createDummyPlace = async (...params) => {
  const dummyPlace = generateDummyPlace(...params);
  return Place.create(dummyPlace);
};

export default Place;

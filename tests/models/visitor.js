import { nanoid } from 'nanoid';
import Visitor, { TYPE_VISITOR } from '../../src/models/visitor';

export const generateDummyVisitor = (...params) => ({
  firstname: nanoid(),
  usageLastname: nanoid(),
  email: `${nanoid()}@localhost`,
  birthLastname: nanoid(),
  nationality: nanoid(),
  birthday: new Date(),
  birthplace: nanoid(),
  isInternal: false,
  company: nanoid(),
  employeeType: TYPE_VISITOR,
  ...params.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
});

export const createDummyVisitor = async (...params) => {
  const dummyVisitor = generateDummyVisitor(...params);
  return Visitor.create(dummyVisitor);
};

export default Visitor;

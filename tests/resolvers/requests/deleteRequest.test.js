import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';
import Request, { createDummyRequest } from '../../models/request';
import Visitor, { createDummyVisitor } from '../../models/visitor';

function mutateDeleteRequest(campusId, requestId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation DeleteRequestMutation($requestId: String!, $campusId: String!) {
            mutateCampus(id: $campusId) {
                deleteRequest(id: $requestId) {
                    id
                }
            }
        }
    `,
    variables: { campusId: campusId.toString(), requestId: requestId.toString() },
  });
}

it('Test to delete a request', async () => {
  const dummyCampus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus: { _id: dummyCampus._id }, owner });
  const fakeId = new mongoose.Types.ObjectId();
  await createDummyVisitor({
    request: dummyRequest,
    firstname: 'Foo',
    birthLastname: 'Bar',
    usageLastname: 'Bar',
    birthday: new Date('1970-01-01'),
    birthdayPlace: 'Paris',
  });
  expect(await Visitor.countDocuments({ 'request._id': dummyRequest._id })).toEqual(1);

  try {
    {
      const { errors } = await mutateDeleteRequest(dummyCampus._id, dummyRequest._id);

      // You're not authorized to delete campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteRequest(
        dummyCampus._id,
        fakeId,
        generateDummyAdmin(),
      );
      // Found no campus with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Request not found');
    }
    {
      const { data } = await mutateDeleteRequest(
        dummyCampus._id,
        dummyRequest._id,
        generateDummyAdmin(),
      );
      expect(data.mutateCampus.deleteRequest).toHaveProperty('id', dummyRequest.id);
      const dbVersion = await Request.findOne({ _id: dummyRequest._id });
      expect(dbVersion).toBeNull();
      expect(await Visitor.countDocuments({ 'request._id': dummyRequest._id })).toEqual(0);
    }
  } finally {
    await Campus.findOneAndDelete({ _id: dummyCampus._id });
    await Request.findOneAndDelete({ _id: dummyRequest._id });
  }
});

import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';
import Request, { createDummyRequest } from '../../models/request';

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
    }
  } finally {
    await Campus.findOneAndDelete({ _id: dummyCampus._id });
    await Request.findOneAndDelete({ _id: dummyRequest._id });
  }
});

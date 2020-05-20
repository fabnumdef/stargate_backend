import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';

function mutateEditionRequest(campusId, id, request, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditRequestMutation($campusId: String!, $id: String!, $request: RequestInput!) {
        mutateCampus(id: $campusId) {
          editRequest(id: $id, request: $request) {
            id
          }
        }
      }
    `,
    variables: { campusId, id: id.toString(), request },
  });
}

it('Test to edit a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const newFrom = new Date();
  try {
    {
      const { errors } = await mutateEditionRequest(campus._id, dummyRequest._id, { from: newFrom.toISOString() });

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { editRequest: editedRequest } } } = await mutateEditionRequest(
        campus._id,
        dummyRequest._id,
        { from: newFrom.toISOString() },
        generateDummySuperAdmin(),
      );
      expect(editedRequest).toHaveProperty('id', dummyRequest.id);
      const dbVersion = await Request.findOne({ _id: dummyRequest._id });
      expect(dbVersion).toMatchObject({ _id: dummyRequest._id, from: newFrom });
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});
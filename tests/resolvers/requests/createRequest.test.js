import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { generateDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';

function mutateCreateRequest(campusId, request, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreateRequestMutation($campusId: String!, $request: RequestInput!) {
        mutateCampus(id: $campusId) {
          createRequest(request: $request) {
            id
          }
        }
      }
    `,
    variables: { campusId, request },
  });
}

it('Test to create a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();

  const dummyRequest = generateDummyRequest();

  try {
    {
      const { errors } = await mutateCreateRequest(campus._id, dummyRequest);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { createRequest: createdRequest } } } = await mutateCreateRequest(
        campus._id,
        {
          ...dummyRequest,
          from: dummyRequest.from.toISOString(),
          to: dummyRequest.to.toISOString(),
        },
        generateDummyAdmin(owner),
      );
      expect(createdRequest).toHaveProperty('id');
      const dbVersion = await Request.findById(createdRequest.id);
      expect(dbVersion).toMatchObject({
        from: dummyRequest.from,
        to: dummyRequest.to,
      });
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Request.findOneAndDelete(dummyRequest);
    await campus.deleteOne();
  }
});

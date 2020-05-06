import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest, generateDummyVisitor } from '../../models/request';
import { createDummyCampus } from '../../models/campus';

function mutateAddVisitorRequest(campusId, requestId, visitor, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditRequestMutation($campusId: String!, $requestId: String!, $visitor: RequestVisitorInput!) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            addVisitor(visitor: $visitor) {
              id
            }
          }
        }
      }
        `,
    variables: { campusId, requestId: requestId.toString ? requestId.toString() : requestId, visitor },
  });
}

it('Test to add a visitor to a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitor = await generateDummyVisitor();
  try {
    {
      const { errors } = await mutateAddVisitorRequest(campus._id, dummyRequest._id, visitor);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { mutateRequest: { addVisitor } } } } = await mutateAddVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitor,
        generateDummySuperAdmin(),
      );
      expect(addVisitor).toHaveProperty('id');
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest, generateDummyVisitor } from '../../models/request';
import { createDummyCampus } from '../../models/campus';

function mutateRemoveVisitorRequest(campusId, requestId, visitorId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation RemoveVisitorRequestMutation($campusId: String!, $requestId: String!, $visitorId: String!) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            deleteVisitor(id: $visitorId) {
              id
            }
          }
        }
      }
    `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
      visitorId: visitorId.toString ? visitorId.toString() : visitorId,
    },
  });
}

it('Test to remove a visitor from a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner, visitors: [await generateDummyVisitor()] });
  const visitor = dummyRequest.visitors[0];
  try {
    {
      const { errors } = await mutateRemoveVisitorRequest(campus._id, dummyRequest._id, visitor.id);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { mutateRequest: { deleteVisitor } } } } = await mutateRemoveVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitor._id,
        generateDummySuperAdmin(),
      );
      expect(deleteVisitor).toHaveProperty('id');
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

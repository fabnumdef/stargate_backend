import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { generateDummyVisitor } from '../../models/visitor';

function mutatecreateVisitorRequest(campusId, requestId, visitor, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation createVisitorRequestMutation($campusId: String!, $requestId: String!, $visitor: RequestVisitorInput!) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            createVisitor(visitor: $visitor) {
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
      const { errors } = await mutatecreateVisitorRequest(campus._id, dummyRequest._id, visitor);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { mutateRequest: { createVisitor } } } } = await mutatecreateVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitor,
        generateDummySuperAdmin(),
      );
      expect(createVisitor).toHaveProperty('id');
      const dbVersion = await Visitor.findById(createVisitor.id);
      expect(dbVersion).toMatchObject({
        firstname: visitor.firstname,
        usageLastname: visitor.usageLastname,
      });
      expect(dbVersion).toHaveProperty('request._id', dummyRequest._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

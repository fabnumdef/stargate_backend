import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest, generateDummyVisitor } from '../../models/request';
import { createDummyCampus } from '../../models/campus';

function queryListVisitorsRequest(campusId, requestId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
            query ListVisitorsRequestQuery($campusId: String!, $requestId: String!) {
                getCampus(id: $campusId) {
                    getRequest(id: $requestId) {
                        listVisitors {
                            list {
                                id
                                firstname
                            }
                        }
                    }
                }
            }
        `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
    },
  });
}

it('Test to list visitors in a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const visitors = [await generateDummyVisitor(), await generateDummyVisitor()];
  const dummyRequest = await createDummyRequest({ campus, owner, visitors });

  try {
    {
      const { errors } = await queryListVisitorsRequest(campus._id, dummyRequest._id);
      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { getRequest: { listVisitors } } } } = await queryListVisitorsRequest(
        campus._id,
        dummyRequest._id,
        generateDummySuperAdmin(),
      );
      expect(listVisitors.list).toHaveLength(visitors.length);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

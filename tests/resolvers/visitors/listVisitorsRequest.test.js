import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';

function queryListVisitorsRequest(campusId, requestId, search, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
            query ListVisitorsRequestQuery($campusId: String!, $requestId: String!, $search: String) {
                getCampus(id: $campusId) {
                    getRequest(id: $requestId) {
                        listVisitors(search: $search) {
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
      search,
      requestId: requestId.toString ? requestId.toString() : requestId,
    },
  });
}

it('Test to list visitors in a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest }),
  ];

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
        visitors[0].firstname,
        generateDummySuperAdmin(),
      );
      expect(listVisitors.list).toHaveLength(1);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

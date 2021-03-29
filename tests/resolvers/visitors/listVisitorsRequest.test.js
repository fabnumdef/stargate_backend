import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import Unit, { createDummyUnit } from '../../models/unit';

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
                            meta {
                                total
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

function queryListVisitors(campusId, search, requestsId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListVisitorsRequestQuery($campusId: String!, $search: String, $requestsId: [String]) {
        getCampus(id: $campusId) {
          listVisitors(search: $search, requestsId: $requestsId) {
            list {
              id
              firstname
            }
          }
        }
      }
    `,
    variables: {
      campusId,
      search,
      requestsId,
    },
  });
}

it('Test to list visitors in a request', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });
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
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});

it('Test to list visitors in a campus', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });
  const dummyRequest = await createDummyRequest({ campus, owner });
  const dummyRequest2 = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest }),
    await createDummyVisitor({ request: dummyRequest2 }),
    await createDummyVisitor({ request: dummyRequest2 }),
  ];

  try {
    {
      const { errors } = await queryListVisitors(campus._id);
      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listVisitors } } } = await queryListVisitors(
        campus._id,
        visitors[0].firstname,
        null,
        generateDummySuperAdmin(),
      );
      expect(listVisitors.list).toHaveLength(1);
    }
    {
      const { data: { getCampus: { listVisitors } } } = await queryListVisitors(
        campus._id,
        null,
        [dummyRequest._id.toString()],
        generateDummySuperAdmin(),
      );
      expect(listVisitors.list).toHaveLength(2);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await Request.findOneAndDelete({ _id: dummyRequest2._id });
    await campus.deleteOne();
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});

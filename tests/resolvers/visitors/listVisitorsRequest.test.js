import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import Campus, { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import Unit, { createDummyUnit } from '../../models/unit';
import Place, { generateDummyPlace } from '../../models/place';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';
import { WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_DECISION_ACCEPTED } from '../../../src/models/unit';

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

function queryListVisitors(campusId, search, visitorsId, user = null, isDone = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListVisitorsRequestQuery(
          $campusId: String!,
          $search: String,
          $visitorsId: [String],
          $isDone: RequestVisitorIsDone,
      ) {
        getCampus(id: $campusId) {
          listVisitors(search: $search, visitorsId: $visitorsId, isDone: $isDone) {
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
      visitorsId,
      isDone,
    },
  });
}

function mutatevalidateStepRequest(campusId, requestId, visitorId, personas, decision, tags = [], user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation validateStepRequestMutation(
            $campusId: String!,
            $requestId: String!,
            $visitorId: ObjectID!,
            $personas: ValidationPersonas!,
            $decision: String!
            $tags: [String]
        ) {
            mutateCampus(id: $campusId) {
                mutateRequest(id: $requestId) {
                    validateVisitorStep(id: $visitorId, as: $personas, decision: $decision, tags: $tags) {
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
      personas,
      decision,
      tags,
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
  const unit = await createDummyUnit({
    workflow: {
      steps: [
        {
          role: ROLE_UNIT_CORRESPONDENT,
          behavior: WORKFLOW_BEHAVIOR_VALIDATION,
        },
      ],
    },
  });
  const owner = await generateDummyUser({ unit });
  const place = new Place(generateDummyPlace({ campus, unitInCharge: unit }));
  const dummyRequest = await createDummyRequest({
    campus, owner, status: 'CREATED', places: [place],
  });
  const dummyRequest2 = await createDummyRequest({ campus, owner });
  const visitors = [
    await createDummyVisitor({ request: dummyRequest, status: 'CREATED' }),
    await createDummyVisitor({ request: dummyRequest, status: 'CREATED' }),
    await createDummyVisitor({ request: dummyRequest2, status: 'CREATED' }),
    await createDummyVisitor({ request: dummyRequest2, status: 'CREATED' }),
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
        [visitors[0]._id.toString(), visitors[1]._id.toString()],
        generateDummySuperAdmin(),
      );
      expect(listVisitors.list).toHaveLength(2);
    }
    {
      await mutatevalidateStepRequest(
        campus._id,
        dummyRequest._id,
        visitors[0]._id,
        { unit: unit._id.toString(), role: ROLE_UNIT_CORRESPONDENT },
        WORKFLOW_DECISION_ACCEPTED,
        [],
        generateDummyAdmin(),
      );

      const { data: { getCampus: { listVisitors } } } = await queryListVisitors(
        campus._id,
        null,
        null,
        generateDummySuperAdmin(),
        { role: ROLE_UNIT_CORRESPONDENT, unit: unit._id.toString(), value: true },
      );
      expect(listVisitors.list).toHaveLength(1);
    }
  } finally {
    await Promise.all(visitors.map((v) => Visitor.findOneAndDelete({ _id: v._id })));
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await Request.findOneAndDelete({ _id: dummyRequest2._id });
    await Campus.findOneAndDelete({ _id: campus._id });
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});

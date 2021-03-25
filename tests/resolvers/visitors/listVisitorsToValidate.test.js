import queryFactory, { gql } from '../../helpers/apollo-query';
import { createDummyCampus } from '../../models/campus';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import { createDummyRequest } from '../../models/request';
import { createDummyVisitor } from '../../models/visitor';
import { createDummyUnit } from '../../models/unit';
import { ROLE_ACCESS_OFFICE, ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';
import { WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_DECISION_ACCEPTED } from '../../../src/models/unit';
import { STATE_CREATED } from '../../../src/models/request';

function queryListVisitorsToValidate(campusId, as, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
        query ListVisitorsToValidateQuery(
            $campusId: String!,
            $as: ValidationPersonas!,
        ) {
            getCampus(id: $campusId) {
                listVisitorsToValidate(as: $as) {
                    list {
                        id
                    }
                    meta {
                        total
                    }
                }
            }
        }
    `,
    variables: {
      campusId,
      as,
    },
  });
}

it('Test to list visitors filter by validating step', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });

  const request1 = await createDummyRequest({ campus, owner, status: STATE_CREATED });
  const request2 = await createDummyRequest({ campus, owner, status: STATE_CREATED });
  const visitor1 = await createDummyVisitor({
    request: {
      ...request1.toObject(),
      units: [
        {
          _id: unit._id,
          label: unit.label,
          workflow: {
            steps: [
              { role: ROLE_UNIT_CORRESPONDENT, behavior: WORKFLOW_BEHAVIOR_VALIDATION, state: {} },
              { role: ROLE_ACCESS_OFFICE, behavior: WORKFLOW_BEHAVIOR_VALIDATION, state: {} }],
          },
        },
      ],
    },
  });
  const visitor2 = await createDummyVisitor({
    request: {
      ...request2.toObject(),
      units: [
        {
          _id: unit._id,
          label: unit.label,
          workflow: {
            steps: [
              {
                role: ROLE_UNIT_CORRESPONDENT,
                behavior: WORKFLOW_BEHAVIOR_VALIDATION,
                state: { value: WORKFLOW_DECISION_ACCEPTED, isOK: true },
              },
              {
                role: ROLE_ACCESS_OFFICE,
                behavior: WORKFLOW_BEHAVIOR_VALIDATION,
                state: { },
              },
            ],
          },
        },
      ],
    },
  });

  try {
    {
      const { errors } = await queryListVisitorsToValidate(
        campus._id,
        {
          role: ROLE_UNIT_CORRESPONDENT,
          unit: unit._id.toString(),
        },
      );
      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { data: { getCampus: { listVisitorsToValidate: { list } } } } = await queryListVisitorsToValidate(
        campus._id,
        {
          role: ROLE_ACCESS_OFFICE,
        },
        generateDummyAdmin(),
      );
      expect(list).toHaveLength(1);
      expect(list[0].id).toEqual(visitor2._id);
    }
    {
      const { data: { getCampus: { listVisitorsToValidate: { list } } } } = await queryListVisitorsToValidate(
        campus._id,
        {
          role: ROLE_UNIT_CORRESPONDENT,
          unit: unit._id.toString(),
        },
        generateDummyAdmin(),
      );
      expect(list).toHaveLength(1);
      expect(list[0].id).toEqual(visitor1._id);
    }
  } finally {
    await visitor1.deleteOne();
    await visitor2.deleteOne();
    await request1.deleteOne();
    await request2.deleteOne();
    await unit.deleteOne();
    await campus.deleteOne();
    await unit.deleteOne();
  }
});

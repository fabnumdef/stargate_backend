import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import { createDummyUnit } from '../../models/unit';
import { ROLE_ADMIN, ROLE_OBSERVER, ROLE_SCREENING } from '../../../src/models/rules';
import {
  WORKFLOW_BEHAVIOR_ACK,
  WORKFLOW_BEHAVIOR_ADVISEMENT, WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_DECISION_POSITIVE, WORKFLOW_DECISION_REJECTED,
} from '../../../src/models/unit';
import Place, { generateDummyPlace } from '../../models/place';
import { EVENT_CREATE } from '../../../src/models/request';

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
              firstname
              status
              units {
                steps {
                  role
                  behavior
                  state {
                    value
                    isOK
                    date
                    tags
                  }
                }
              }
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

it('Test to validate a step for a visitor', async () => {
  const campus = await createDummyCampus();
  const unit1 = await createDummyUnit({
    campus,
    workflow: {
      steps: [
        {
          role: ROLE_ADMIN,
          behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
        },
        {
          role: ROLE_SCREENING,
          behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
        },
        {
          role: ROLE_OBSERVER,
          behavior: WORKFLOW_BEHAVIOR_INFORMATION,
        },
        {
          role: ROLE_ADMIN,
          behavior: WORKFLOW_BEHAVIOR_VALIDATION,
        },
      ],
    },
  });
  const unit2 = await createDummyUnit({
    campus,
    workflow: {
      steps: [
        {
          role: ROLE_ADMIN,
          behavior: WORKFLOW_BEHAVIOR_VALIDATION,
        },
        {
          role: ROLE_SCREENING,
          behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
        },
      ],
    },
  });

  const place1 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
  const place2 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
  const place3 = new Place(generateDummyPlace({ campus, unitInCharge: unit2 }));
  const owner = await generateDummyUser({ unit: unit1 });

  const request = await createDummyRequest({
    campus,
    owner,
    places: [
      place1,
      place2,
      place3,
    ],
  });

  const visitor = await createDummyVisitor({
    request,
    firstname: 'Foo',
    birthLastname: 'Bar',
    usageLastname: 'Bar',
    birthday: new Date('1970-01-01'),
    birthdayPlace: 'Paris',
  });
  request.stateMutation(EVENT_CREATE);
  await request.save();

  try {
    {
      const { errors } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {},
        '',
      );

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { errors } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        new mongoose.Types.ObjectId(),
        {},
        '',
        [],
        generateDummyAdmin(),
      );
      // You're should not mutate a visitor that not exists.
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Visitor not found');
    }
    {
      const { errors } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit1._id.toString(),
          role: ROLE_ADMIN,
        },
        'foo',
        [],
        generateDummyAdmin(),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Advisement behavior cannot accept "foo" decision.');
    }
    {
      const { errors } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit1._id.toString(),
          role: ROLE_OBSERVER,
        },
        WORKFLOW_BEHAVIOR_ACK,
        [],
        generateDummyAdmin(),
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Previous step for role ROLE_OBSERVER not yet validated');
    }
    {
      const { errors } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          role: ROLE_SCREENING,
        },
        WORKFLOW_DECISION_POSITIVE,
        [],
        generateDummyAdmin(),
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Previous step for role ROLE_SCREENING not yet validated');
    }
    {
      const TAG = 'TAG';
      const { data: { mutateCampus: { mutateRequest: { validateVisitorStep } } } } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit1._id.toString(),
          role: ROLE_ADMIN,
        },
        WORKFLOW_DECISION_POSITIVE,
        [TAG],
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(validateVisitorStep.id);
      const dbUnit = dbVersion.request.units.find((u) => u._id.equals(unit1._id));
      const dbStep = dbUnit.workflow.steps.find((s) => s._id.equals(unit1.workflow.steps[0]._id));
      expect(dbStep.state.value).toEqual(WORKFLOW_DECISION_POSITIVE);
      expect(dbStep.state.payload.tags).toEqual(expect.arrayContaining([TAG]));
      expect(dbVersion).toHaveProperty('__v', 1);
    }
    {
      await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit2._id.toString(),
          role: ROLE_ADMIN,
        },
        WORKFLOW_DECISION_REJECTED,
        [],
        generateDummyAdmin(),
      );
      const { data: { mutateCampus: { mutateRequest: { validateVisitorStep } } } } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          role: ROLE_SCREENING,
        },
        WORKFLOW_DECISION_POSITIVE,
        [],
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(validateVisitorStep.id);
      const dbUnit = dbVersion.request.units.find((u) => u._id.equals(unit1._id));
      const dbStep = dbUnit.workflow.steps.find((s) => s._id.equals(unit1.workflow.steps[1]._id));
      expect(dbStep.state.value).toEqual(WORKFLOW_DECISION_POSITIVE);
      expect(dbVersion).toHaveProperty('__v', 3);
    }
    {
      const { data: { mutateCampus: { mutateRequest: { validateVisitorStep } } } } = await mutatevalidateStepRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit1._id.toString(),
          role: ROLE_OBSERVER,
        },
        WORKFLOW_BEHAVIOR_ACK,
        [],
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(validateVisitorStep.id);
      const dbUnit = dbVersion.request.units.find((u) => u._id.equals(unit1._id));
      const dbStep = dbUnit.workflow.steps.find((s) => s._id.equals(unit1.workflow.steps[2]._id));
      expect(dbStep.state.value).toEqual(WORKFLOW_BEHAVIOR_ACK);
      expect(dbVersion).toHaveProperty('__v', 4);
    }
  } finally {
    await visitor.deleteOne();
    await request.deleteOne();
    await campus.deleteOne();
  }
});

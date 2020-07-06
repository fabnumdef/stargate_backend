import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import { createDummyUnit } from '../../models/unit';
import { ROLE_ADMIN } from '../../../src/models/rules';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../../src/models/unit';
import Place, { generateDummyPlace } from '../../models/place';
import { EVENT_CREATE } from '../../../src/models/request';

function mutateShiftVisitorRequest(campusId, requestId, visitorId, personas, transition, tags = [], user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation shiftVisitorRequestMutation(
        $campusId: String!,
        $requestId: String!,
        $visitorId: String!,
        $personas: ValidationPersonas!,
        $transition: String!
        $tags: [String]
      ) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            shiftVisitor(id: $visitorId, as: $personas, transition: $transition, tags: $tags) {
              id
              firstname
              state {
                records {
                  date
                  tags
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
      transition,
      tags,
    },
  });
}

it('Test to shift a visitor', async () => {
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
          role: ROLE_ADMIN,
          behavior: WORKFLOW_BEHAVIOR_INFORMATION,
        },
        {
          role: ROLE_ADMIN,
          behavior: WORKFLOW_BEHAVIOR_VALIDATION,
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
      ],
    },
  });

  const place1 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
  const place2 = new Place(generateDummyPlace({ campus, unitInCharge: unit1 }));
  const place3 = new Place(generateDummyPlace({ campus, unitInCharge: unit2 }));
  const owner = await generateDummyUser();

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
      const { errors } = await mutateShiftVisitorRequest(
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
      const { errors } = await mutateShiftVisitorRequest(
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
      const { errors } = await mutateShiftVisitorRequest(
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
      expect(errors[0].message).toContain('You cannot shift to this state');
    }
    {
      const TAG = 'TAG';
      const { data: { mutateCampus: { mutateRequest: { shiftVisitor } } } } = await mutateShiftVisitorRequest(
        campus._id,
        request._id,
        visitor._id,
        {
          unit: unit1._id.toString(),
          role: ROLE_ADMIN,
        },
        'positive',
        [TAG],
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(shiftVisitor.id);
      expect(dbVersion.interpretedStateMachine.state.value).toMatchObject({
        created: {
          [`U${unit1.id}`]: `U${unit1.id}S${unit1.workflow.steps[1]._id}`,
          [`U${unit2.id}`]: `U${unit2.id}S${unit2.workflow.steps[0]._id}`,
        },
      });
      expect(dbVersion.state.records[0].tags).toEqual(expect.arrayContaining([TAG]));
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await visitor.deleteOne();
    await request.deleteOne();
    await campus.deleteOne();
  }
});

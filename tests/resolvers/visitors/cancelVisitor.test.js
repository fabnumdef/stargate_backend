import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { createDummyCampus } from '../../models/campus';
import { createDummyUnit } from '../../models/unit';
import {
  ROLE_ADMIN,
  ROLE_HOST,
  ROLE_OBSERVER,
  ROLE_SCREENING,
} from '../../../src/models/rules';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../../src/models/unit';
import Place, { generateDummyPlace } from '../../models/place';
import { createDummyUser, generateDummyAdmin } from '../../models/user';
import { createDummyRequest } from '../../models/request';
import { createDummyVisitor } from '../../models/visitor';
import { EVENT_CREATE, STATE_CANCELED } from '../../../src/models/request';

function mutateCancelVisitor(campusId, requestId, visitorId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation cancelVisitorMutation(
            $campusId: String!,
            $requestId: String!,
            $visitorId: ObjectID!,
        ) {
            mutateCampus(id: $campusId) {
                mutateRequest(id: $requestId) {
                    cancelVisitor(id: $visitorId) {
                        id
                        status
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

it('Test to validate a step for a visitor', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit({
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

  const place = new Place(generateDummyPlace({ campus, unitInCharge: unit }));
  const owner = await createDummyUser({ roles: [{ role: ROLE_HOST, units: [unit] }] });

  const request = await createDummyRequest({
    campus,
    owner: {
      ...owner.toObject(),
      unit,
    },
    places: [
      place,
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
      const { errors } = await mutateCancelVisitor(
        campus._id,
        request._id,
        visitor._id,
      );

      // You're not authorized to cancel a visitor while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { errors } = await mutateCancelVisitor(
        campus._id,
        request._id,
        visitor._id,
        generateDummyAdmin(),
      );

      // You're not authorized to cancel a visitor if you're not owner
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Only the owner can cancel a visitor');
    }
    {
      const { errors } = await mutateCancelVisitor(
        campus._id,
        request._id,
        new mongoose.Types.ObjectId(),
        owner,
      );
      // You're should not mutate a visitor that not exists.
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Visitor not found');
    }
    {
      const { data: { mutateCampus: { mutateRequest: { cancelVisitor } } } } = await mutateCancelVisitor(
        campus._id,
        request._id,
        visitor._id,
        owner,
      );
      expect(cancelVisitor.status).toBe(STATE_CANCELED);
    }
  } finally {
    await visitor.deleteOne();
    await request.deleteOne();
    await campus.deleteOne();
    await owner.deleteOne();
  }
});

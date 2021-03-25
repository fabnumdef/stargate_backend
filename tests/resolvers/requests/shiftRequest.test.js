import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import Campus, { createDummyCampus } from '../../models/campus';
import { EVENT_CANCEL, EVENT_CREATE, STATE_CREATED } from '../../../src/models/request';
import Unit, { createDummyUnit } from '../../models/unit';

function mutateShiftRequest(campusId, requestId, transition, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation shiftRequestMutation(
        $campusId: String!,
        $requestId: String!,
        $transition: RequestTransition!
      ) {
        mutateCampus(id: $campusId) {
          shiftRequest(id: $requestId, transition: $transition) {
            id
            status
          }
        }
      }
    `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
      transition,
    },
  });
}

it('Test to shift a request', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });

  const request = await createDummyRequest({
    campus,
    owner,
  });

  try {
    {
      const { errors } = await mutateShiftRequest(
        campus._id,
        request._id,
        EVENT_CANCEL,
      );

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { errors } = await mutateShiftRequest(
        campus._id,
        new mongoose.Types.ObjectId(),
        EVENT_CANCEL,
        generateDummyAdmin(),
      );
      // You're should not mutate a request that not exists.
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Request not found');
    }
    {
      const { errors } = await mutateShiftRequest(
        campus._id,
        request._id,
        EVENT_CANCEL,
        generateDummyAdmin(),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('You cannot shift to this state');
    }
    {
      const { data: { mutateCampus: { shiftRequest } } } = await mutateShiftRequest(
        campus._id,
        request._id,
        EVENT_CREATE,
        generateDummyAdmin(),
      );
      expect(shiftRequest).toHaveProperty('status', STATE_CREATED);
      const dbVersion = await Request.findById(shiftRequest.id);
      expect(dbVersion.interpretedStateMachine.state.value).toEqual(STATE_CREATED);
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Request.findOneAndDelete({ _id: request._id });
    await Campus.findOneAndDelete({ _id: campus._id });
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});

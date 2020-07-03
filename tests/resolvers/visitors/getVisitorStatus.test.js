import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import { createDummyVisitor } from '../../models/visitor';
import { createDummyCampus } from '../../models/campus';
import { createDummyRequest } from '../../models/request';
import { createDummyUnit } from '../../models/unit';
import { ROLE_ADMIN } from '../../../src/models/rules';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_INFORMATION,
  WORKFLOW_BEHAVIOR_VALIDATION,
} from '../../../src/models/unit';
import Place, { generateDummyPlace } from '../../models/place';

function queryGetVisitorRequest(campusId, requestId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetVisitorRequestQuery($campusId: String!, $requestId: String!, $id: String!) {
        getCampus(id: $campusId) {
          getRequest(id: $requestId) {
            getVisitor(id: $id) {
              status {
                unitId
                steps {
                  step
                  role
                  behavior
                  status
                  done
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      campusId,
      requestId,
      id: typeof id === 'string' ? id : id.toString(),
    },
  });
}

it('Test to get a status of visitor', async () => {
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
  const step = visitor.getStep(unit1._id, ROLE_ADMIN);
  await visitor.stateSend('CREATE');
  await visitor.stateMutation(unit1._id.toString(), step._id, 'positive');
  await visitor.save();
  try {
    {
      const { errors } = await queryGetVisitorRequest(campus._id, request._id, visitor._id);

      // You're not authorized to create visitorRequest while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { errors } = await queryGetVisitorRequest(
        campus._id,
        request._id,
        new mongoose.Types.ObjectId(),
        generateDummySuperAdmin(),
      );

      // you cannot get not existing data
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Visitor not found');
    }

    {
      const { data: { getCampus: { getRequest: { getVisitor: { status } } } } } = await queryGetVisitorRequest(
        campus._id,
        request._id,
        visitor._id,
        generateDummySuperAdmin(),
      );
      expect(
        status
          .find((unitRow) => unit1._id.toString() === unitRow.unitId).steps
          .find((stepRow) => stepRow.step === step._id.toString()),
      )
        .toMatchObject({
          status: 'positive',
          done: true,
        });
    }
  } finally {
    await visitor.deleteOne();
    await request.deleteOne();
    await campus.deleteOne();
  }
});

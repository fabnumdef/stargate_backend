import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import { createDummyVisitor } from '../../models/visitor';
import { createDummyCampus } from '../../models/campus';
import { createDummyRequest } from '../../models/request';

function queryGetVisitorRequest(campusId, requestId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetVisitorRequestQuery($campusId: String!, $requestId: String!, $id: ObjectID!) {
        getCampus(id: $campusId) {
          getRequest(id: $requestId) {
            getVisitor(id: $id) {
              id
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

it('Test to get a visitorRequest', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();

  const request = await createDummyRequest({
    campus,
    owner,
    places: [],
  });

  const visitor = await createDummyVisitor({
    request,
    firstname: 'Foo',
    birthLastname: 'Bar',
    usageLastname: 'Bar',
    birthday: new Date('1970-01-01'),
    birthdayPlace: 'Paris',
  });
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
      const { data: { getCampus: { getRequest: { getVisitor: visitorRequest } } } } = await queryGetVisitorRequest(
        campus._id,
        request._id,
        visitor._id,
        generateDummySuperAdmin(),
      );
      expect(visitorRequest).toHaveProperty('id', visitor._id.toString());
    }
  } finally {
    await visitor.deleteOne();
    await request.deleteOne();
    await campus.deleteOne();
  }
});

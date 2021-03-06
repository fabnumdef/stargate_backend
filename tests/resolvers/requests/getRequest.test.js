import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Unit, { createDummyUnit } from '../../models/unit';

function queryGetRequest(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetRequestQuery($campusId: String!, $id: String!) {
        getCampus(id: $campusId) {
          getRequest(id: $id) {
            id
          }
        }
      }
    `,
    variables: {
      campusId,
      id: typeof id === 'string' ? id : id.toString(),
    },
  });
}

it('Test to get a request', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const owner = await generateDummyUser({ unit });
  const dummyRequest = await createDummyRequest({ campus, owner });
  try {
    {
      const { errors } = await queryGetRequest(campus._id, dummyRequest._id);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await queryGetRequest(campus._id, nanoid(), generateDummySuperAdmin());

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Request not found');
    }

    {
      const { data: { getCampus: { getRequest: request } } } = await queryGetRequest(
        campus._id,
        dummyRequest._id,
        generateDummySuperAdmin(),
      );
      expect(request).toHaveProperty('id', dummyRequest._id.toString());
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
    await Unit.findOneAndDelete({ _id: unit._id });
  }
});

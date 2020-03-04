import queryFactory, { gql } from '../helpers/apollo-query';
import { generateDummySuperAdmin } from '../models/user';
import Zone, { createDummyZone } from '../models/zone';
import { createDummyCampus } from '../models/campus';

function queryGetZone(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetZoneQuery($campusId: String!, $id: String!) {
        getCampus(id: $campusId) {
          getZone(id: $id) {
            id
            label
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

it('Test to get a zone', async () => {
  const campus = await createDummyCampus();
  const dummyZone = await createDummyZone({ campus });
  try {
    {
      const { errors } = await queryGetZone(campus._id, dummyZone._id);

      // You're not authorized to create zone while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { getZone: zone } } } = await queryGetZone(
        campus._id,
        dummyZone._id,
        generateDummySuperAdmin(),
      );
      expect(zone).toHaveProperty('id', dummyZone._id.toString());
      expect(zone).toHaveProperty('label', dummyZone.label);
    }
  } finally {
    await Zone.findOneAndDelete({ _id: dummyZone._id });
    await campus.deleteOne();
  }
});

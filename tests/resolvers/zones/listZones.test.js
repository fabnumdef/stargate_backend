import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import { createDummyCampus } from '../../models/campus';
import Zone, { createDummyZone } from '../../models/zone';

function queryListZones(zonesId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListZonesQuery($zonesId: String!) {
        getCampus(id: $zonesId) {
          listZones {
            list {
              id
              label
            }
            meta {
              offset
              first
              total
            }
          }
        }
      }
    `,
    variables: { zonesId },
  });
}

beforeAll(async () => {
  await Zone.deleteMany({});
});

it('Test to list zones', async () => {
  await Promise.all(Array.from({ length: 1 }).map(() => createDummyZone()));
  const campus = await createDummyCampus();
  const list = await Promise.all(Array.from({ length: 5 }).map(() => createDummyZone({ campus })));
  try {
    {
      const { errors } = await queryListZones(campus._id);

      // You're not authorized to create zones while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listZones } } } = await queryListZones(
        campus._id,
        generateDummySuperAdmin(),
      );
      // Check default values
      expect(listZones.list).toHaveLength(list.length);
      expect(listZones.meta).toMatchObject({
        total: list.length,
        first: 30,
        offset: 0,
      });
    }
  } finally {
    await Zone.deleteMany({ _id: list.map((c) => c._id) });
  }
});

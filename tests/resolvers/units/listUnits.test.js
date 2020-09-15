import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import { createDummyCampus } from '../../models/campus';
import Unit, { createDummyUnit } from '../../models/unit';

function queryListUnits(unitsId, user = null, search = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListUnitsQuery($unitsId: String!, $search: String) {
        getCampus(id: $unitsId) {
          listUnits(search: $search) {
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
    variables: { unitsId, search },
  });
}

beforeAll(async () => {
  await Unit.deleteMany({});
});

it('Test to list units', async () => {
  await Promise.all(Array.from({ length: 1 }).map(() => createDummyUnit()));
  const campus = await createDummyCampus();
  const list = await Promise.all(Array.from({ length: 5 }).map(() => createDummyUnit({ campus })));
  try {
    {
      const { errors } = await queryListUnits(campus._id);

      // You're not authorized to create units while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listUnits } } } = await queryListUnits(
        campus._id,
        generateDummySuperAdmin(),
      );
      // Check default values
      expect(listUnits.list).toHaveLength(list.length);
      expect(listUnits.meta).toMatchObject({
        total: list.length,
        first: 30,
        offset: 0,
      });
    }
    {
      const { data: { getCampus: { listUnits } } } = await queryListUnits(
        campus._id,
        generateDummySuperAdmin(),
        list[0].label,
      );
      // Check default values
      expect(listUnits.list).toHaveLength(1);
      expect(listUnits.list[0].label).toMatch(list[0].label);
    }
  } finally {
    await Unit.deleteMany({ _id: list.map((c) => c._id) });
  }
});

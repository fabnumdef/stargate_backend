import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import { createDummyCampus } from '../../models/campus';
import Place, { createDummyPlace } from '../../models/place';
import { createDummyUnit } from '../../models/unit';

function queryListPlaces(placesId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListPlacesQuery($placesId: String!) {
        getCampus(id: $placesId) {
          listPlaces {
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
    variables: { placesId },
  });
}

beforeAll(async () => {
  await Place.deleteMany({});
});

it('Test to list places', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  await Promise.all(Array.from({ length: 1 }).map(() => createDummyPlace({ unitInCharge: unit })));
  const list = await Promise.all(
    Array.from({ length: 5 })
      .map(() => createDummyPlace({ campus, unitInCharge: unit })),
  );
  try {
    {
      const { errors } = await queryListPlaces(campus._id);

      // You're not authorized to create places while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listPlaces } } } = await queryListPlaces(
        campus._id,
        generateDummySuperAdmin(),
      );
      // Check default values
      expect(listPlaces.list).toHaveLength(list.length);
      expect(listPlaces.meta).toMatchObject({
        total: list.length,
        first: 30,
        offset: 0,
      });
    }
  } finally {
    await Place.deleteMany({ _id: list.map((c) => c._id) });
    await unit.deleteOne();
    await campus.deleteOne();
  }
});

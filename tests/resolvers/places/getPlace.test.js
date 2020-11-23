import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Place, { createDummyPlace } from '../../models/place';
import { createDummyCampus } from '../../models/campus';
import { createDummyUnit } from '../../models/unit';

function queryGetPlace(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetPlaceQuery($campusId: String!, $id: ObjectID!) {
        getCampus(id: $campusId) {
          getPlace(id: $id) {
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

it('Test to get a place', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const dummyPlace = await createDummyPlace({ campus, unitInCharge: unit });
  try {
    {
      const { errors } = await queryGetPlace(campus._id, dummyPlace._id);

      // You're not authorized to create place while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { getPlace: place } } } = await queryGetPlace(
        campus._id,
        dummyPlace._id,
        generateDummySuperAdmin(),
      );
      expect(place).toHaveProperty('id', dummyPlace._id.toString());
      expect(place).toHaveProperty('label', dummyPlace.label);
    }
  } finally {
    await Place.findOneAndDelete({ _id: dummyPlace._id });
    await unit.deleteOne();
    await campus.deleteOne();
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin } from '../../models/user';
import Place, { generateDummyPlace } from '../../models/place';
import { createDummyCampus } from '../../models/campus';
import { createDummyUnit } from '../../models/unit';

function mutateCreatePlace(campusId, place, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreatePlaceMutation($campusId: String!, $place: PlaceInput!) {
        mutateCampus(id: $campusId) {
          createPlace(place: $place) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, place },
  });
}

it('Test to create a place', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const dummyPlace = generateDummyPlace();
  try {
    {
      const { errors } = await mutateCreatePlace(
        campus._id,
        { unitInCharge: unit._id.toString(), ...dummyPlace },
      );

      // You're not authorized to create place while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { createPlace: createdPlace } } } = await mutateCreatePlace(
        campus._id,
        { unitInCharge: unit._id.toString(), ...dummyPlace },
        generateDummyAdmin(),
      );
      expect(createdPlace).toHaveProperty('id');
      expect(createdPlace).toHaveProperty('label', dummyPlace.label);
      const dbVersion = await Place.findById(createdPlace.id);
      expect(dbVersion).toMatchObject(dummyPlace);
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Place.findOneAndDelete(dummyPlace);
    await unit.deleteOne();
    await campus.deleteOne();
  }
});

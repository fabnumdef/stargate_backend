import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Place, { createDummyPlace } from '../../models/place';
import { createDummyCampus } from '../../models/campus';
import { createDummyUnit } from '../../models/unit';

function mutateEditionPlace(campusId, id, place, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditPlaceMutation($campusId: String!, $id: String!, $place: PlaceInput!) {
        mutateCampus(id: $campusId) {
          editPlace(id: $id, place: $place) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, id: id.toString(), place },
  });
}

it('Test to edit a place', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const dummyPlace = await createDummyPlace({ campus, unitInCharge: unit });
  const newLabel = nanoid();
  try {
    {
      const { errors } = await mutateEditionPlace(campus._id, dummyPlace._id, { label: newLabel });

      // You're not authorized to create place while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { editPlace: editedPlace } } } = await mutateEditionPlace(
        campus._id,
        dummyPlace._id,
        { label: newLabel },
        generateDummySuperAdmin(),
      );
      expect(editedPlace).toHaveProperty('id', dummyPlace.id);
      expect(editedPlace).toHaveProperty('label', newLabel);
      const dbVersion = await Place.findOne({ _id: dummyPlace._id });
      expect(dbVersion).toMatchObject({ _id: dummyPlace._id, label: newLabel });
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Place.findOneAndDelete({ _id: dummyPlace._id });
    await unit.deleteOne();
    await campus.deleteOne();
  }
});

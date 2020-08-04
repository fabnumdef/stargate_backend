import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin } from '../../models/user';
import Place, { createDummyPlace } from '../../models/place';
import { createDummyCampus } from '../../models/campus';

function mutateDeletePlace(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation DeletePlaceMutation($campusId: String!, $id: String!) {
            mutateCampus(id: $campusId) {
                deletePlace(id: $id) {
                    id
                    label
                }
            }
        }
    `,
    variables: { campusId, id: id.toString() },
  });
}

it('Test to delete a place', async () => {
  const campus = await createDummyCampus();
  const dummyPlace = await createDummyPlace({ campus });
  const fakeId = mongoose.Types.ObjectId();
  try {
    {
      const { errors } = await mutateDeletePlace(campus._id, dummyPlace._id);

      // You're not authorized to delete unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeletePlace(
        campus._id,
        fakeId,
        generateDummyAdmin(),
      );
      // Found no unit with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Place not found');
    }
    {
      const { data } = await mutateDeletePlace(
        campus._id,
        dummyPlace._id,
        generateDummyAdmin(),
      );
      expect(data.mutateCampus.deletePlace).toHaveProperty('id', dummyPlace.id);
      const dbVersion = await Place.findOne({ _id: dummyPlace._id });
      expect(dbVersion).toBeNull();
    }
  } finally {
    await Place.findOneAndDelete({ _id: dummyPlace._id });
  }
});

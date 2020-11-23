import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Zone, { createDummyZone } from '../../models/zone';
import { createDummyCampus } from '../../models/campus';

function mutateDeleteZone(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation DeleteZoneMutation($campusId: String!, $id: ObjectID!) {
            mutateCampus(id: $campusId) {
                deleteZone(id: $id) {
                    id
                    label
                }
            }
        }
    `,
    variables: { campusId, id: id.toString() },
  });
}

it('Test to delete an zone', async () => {
  const campus = await createDummyCampus();
  const dummyZone = await createDummyZone({ campus });
  const fakeId = mongoose.Types.ObjectId();
  try {
    {
      const { errors } = await mutateDeleteZone(campus._id, dummyZone._id);

      // You're not authorized to delete zone while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteZone(
        campus._id,
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no zone with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Zone not found');
    }
    {
      const { data } = await mutateDeleteZone(
        campus._id,
        dummyZone._id,
        generateDummySuperAdmin(),
      );
      expect(data.mutateCampus.deleteZone).toHaveProperty('id', dummyZone.id);
      const dbVersion = await Zone.findOne({ _id: dummyZone._id });
      expect(dbVersion).toBeNull();
    }
  } finally {
    await Zone.findOneAndDelete({ _id: dummyZone._id });
  }
});

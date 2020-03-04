import nanoid from 'nanoid';
import queryFactory, { gql } from '../helpers/apollo-query';
import { generateDummySuperAdmin } from '../models/user';
import Zone, { createDummyZone } from '../models/zone';
import { createDummyCampus } from '../models/campus';

function mutateEditionZone(campusId, id, zone, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditZoneMutation($campusId: String!, $id: String!, $zone: ZoneInput!) {
        mutateCampus(id: $campusId) {
          editZone(id: $id, zone: $zone) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, id: id.toString(), zone },
  });
}

it('Test to edit a zone', async () => {
  const campus = await createDummyCampus();
  const dummyZone = await createDummyZone({ campus });
  const newLabel = nanoid();
  try {
    {
      const { errors } = await mutateEditionZone(campus._id, dummyZone._id, { label: newLabel });

      // You're not authorized to create zone while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { editZone: editedZone } } } = await mutateEditionZone(
        campus._id,
        dummyZone._id,
        { label: newLabel },
        generateDummySuperAdmin(),
      );
      expect(editedZone).toHaveProperty('id', dummyZone.id);
      expect(editedZone).toHaveProperty('label', newLabel);
      const dbVersion = await Zone.findOne({ _id: dummyZone._id });
      expect(dbVersion).toMatchObject({ _id: dummyZone._id, label: newLabel });
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Zone.findOneAndDelete({ _id: dummyZone._id });
    await campus.deleteOne();
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Zone, { generateDummyZone } from '../../models/zone';
import { createDummyCampus } from '../../models/campus';

function mutateCreateZone(campusId, zone, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreateZoneMutation($campusId: String!, $zone: ZoneInput!) {
        mutateCampus(id: $campusId) {
          createZone(zone: $zone) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, zone },
  });
}

it('Test to create a zone', async () => {
  const campus = await createDummyCampus();
  const dummyZone = generateDummyZone();

  try {
    {
      const { errors } = await mutateCreateZone(campus._id, dummyZone);

      // You're not authorized to create zone while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { createZone: createdZone } } } = await mutateCreateZone(
        campus._id,
        dummyZone,
        generateDummySuperAdmin(),
      );
      expect(createdZone).toHaveProperty('id');
      expect(createdZone).toHaveProperty('label', dummyZone.label);
      const dbVersion = await Zone.findById(createdZone.id);
      expect(dbVersion).toMatchObject(dummyZone);
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Zone.findOneAndDelete(dummyZone);
    await campus.deleteOne();
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Unit, { generateDummyUnit } from '../../models/unit';
import { createDummyCampus } from '../../models/campus';

function mutateCreateUnit(campusId, unit, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreateUnitMutation($campusId: String!, $unit: UnitInput!) {
        mutateCampus(id: $campusId) {
          createUnit(unit: $unit) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, unit },
  });
}

it('Test to create a unit', async () => {
  const campus = await createDummyCampus();
  const dummyUnit = generateDummyUnit();

  try {
    {
      const { errors } = await mutateCreateUnit(campus._id, dummyUnit);

      // You're not authorized to create unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { createUnit: createdUnit } } } = await mutateCreateUnit(
        campus._id,
        dummyUnit,
        generateDummySuperAdmin(),
      );
      expect(createdUnit).toHaveProperty('id');
      expect(createdUnit).toHaveProperty('label', dummyUnit.label);
      const dbVersion = await Unit.findById(createdUnit.id);
      expect(dbVersion).toMatchObject(dummyUnit);
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Unit.findOneAndDelete(dummyUnit);
    await campus.deleteOne();
  }
});

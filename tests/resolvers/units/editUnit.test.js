import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Unit, { createDummyUnit } from '../../models/unit';
import { createDummyCampus } from '../../models/campus';

function mutateEditionUnit(campusId, id, unit, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditUnitMutation($campusId: String!, $id: String!, $unit: UnitInput!) {
        mutateCampus(id: $campusId) {
          editUnit(id: $id, unit: $unit) {
            id
            label
          }
        }
      }
    `,
    variables: { campusId, id: id.toString(), unit },
  });
}

it('Test to edit a unit', async () => {
  const campus = await createDummyCampus();
  const dummyUnit = await createDummyUnit({ campus });
  const newLabel = nanoid();
  try {
    {
      const { errors } = await mutateEditionUnit(campus._id, dummyUnit._id, { label: newLabel });

      // You're not authorized to create unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { editUnit: editedUnit } } } = await mutateEditionUnit(
        campus._id,
        dummyUnit._id,
        { label: newLabel },
        generateDummySuperAdmin(),
      );
      expect(editedUnit).toHaveProperty('id', dummyUnit.id);
      expect(editedUnit).toHaveProperty('label', newLabel);
      const dbVersion = await Unit.findOne({ _id: dummyUnit._id });
      expect(dbVersion).toMatchObject({ _id: dummyUnit._id, label: newLabel });
      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Unit.findOneAndDelete({ _id: dummyUnit._id });
    await campus.deleteOne();
  }
});

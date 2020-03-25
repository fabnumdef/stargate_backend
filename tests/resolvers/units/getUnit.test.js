import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Unit, { createDummyUnit } from '../../models/unit';
import { createDummyCampus } from '../../models/campus';

function queryGetUnit(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetUnitQuery($campusId: String!, $id: String!) {
        getCampus(id: $campusId) {
          getUnit(id: $id) {
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

it('Test to get a unit', async () => {
  const campus = await createDummyCampus();
  const dummyUnit = await createDummyUnit({ campus });
  try {
    {
      const { errors } = await queryGetUnit(campus._id, dummyUnit._id);

      // You're not authorized to create unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { getUnit: unit } } } = await queryGetUnit(
        campus._id,
        dummyUnit._id,
        generateDummySuperAdmin(),
      );
      expect(unit).toHaveProperty('id', dummyUnit._id.toString());
      expect(unit).toHaveProperty('label', dummyUnit.label);
    }
  } finally {
    await Unit.findOneAndDelete({ _id: dummyUnit._id });
    await campus.deleteOne();
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Campus, { generateDummyCampus } from '../../models/campus';

function mutateCreateCampus(id, campus, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreateCampusMutation($id: String!,$campus: CampusInput!) {
        createCampus(id: $id, campus: $campus) {
          id
          label
        }
      }
    `,
    variables: { id, campus },
  });
}

it('Test to create a campus', async () => {
  const dummyCampus = generateDummyCampus();

  try {
    {
      const { errors } = await mutateCreateCampus(dummyCampus._id, { label: dummyCampus.label });

      // You're not authorized to create campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await mutateCreateCampus(
        dummyCampus._id,
        { label: dummyCampus.label },
        generateDummySuperAdmin(),
      );
      expect(data.createCampus).toHaveProperty('id', dummyCampus._id);
      expect(data.createCampus).toHaveProperty('label', dummyCampus.label);
      const dbVersion = await Campus.findOne(dummyCampus);
      expect(dbVersion).toMatchObject(dummyCampus);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Campus.findOneAndDelete(dummyCampus);
  }
});

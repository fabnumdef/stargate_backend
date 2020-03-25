import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';

function queryGetCampus(id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query GetCampusQuery($id: String!) {
        getCampus(id: $id) {
          id
          label
        }
      }
    `,
    variables: { id },
  });
}

it('Test to get a campus', async () => {
  const dummyCampus = await createDummyCampus();
  try {
    {
      const { errors } = await queryGetCampus(dummyCampus._id);

      // You're not authorized to create campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await queryGetCampus(
        dummyCampus._id,
        generateDummySuperAdmin(),
      );
      expect(data.getCampus).toHaveProperty('id', dummyCampus._id);
      expect(data.getCampus).toHaveProperty('label', dummyCampus.label);
    }
  } finally {
    await Campus.findOneAndDelete({ _id: dummyCampus._id });
  }
});

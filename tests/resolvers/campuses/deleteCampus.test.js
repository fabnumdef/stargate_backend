import nanoid from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';

function mutateDeleteCampus(id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation DeleteCampusMutation($id: String!) {
          deleteCampus(id: $id) {
              id
          }
      }
    `,
    variables: { id: id.toString() },
  });
}

it('Test to delete a campus', async () => {
  const dummyCampus = await createDummyCampus();
  try {
    {
      const { errors } = await mutateDeleteCampus(dummyCampus._id);

      // You're not authorized to delete campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteCampus(
        nanoid(),
        generateDummySuperAdmin(),
      );
      // Found no campus with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Campus not found');
    }
    {
      const { data } = await mutateDeleteCampus(
        dummyCampus._id,
        generateDummySuperAdmin(),
      );
      expect(data.deleteCampus).toHaveProperty('id', dummyCampus.id);
      const dbVersion = await Campus.findOne({ _id: dummyCampus._id });
      expect(dbVersion).toBeNull();
    }
  } finally {
    await Campus.findOneAndDelete({ _id: dummyCampus._id });
  }
});

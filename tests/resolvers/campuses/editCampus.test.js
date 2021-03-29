import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummySuperAdmin } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';

function mutateEditionCampus(id, campus, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation EditCampusMutation($id: String!, $campus: EditCampusInput!) {
        editCampus(id: $id, campus: $campus) {
          id
          label
        }
      }
    `,
    variables: { id, campus },
  });
}

it('Test to edit a campus', async () => {
  const dummyCampus = await createDummyCampus();
  const newLabel = nanoid();
  try {
    {
      const { errors } = await mutateEditionCampus(dummyCampus._id, { label: newLabel });

      // You're not authorized to create campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await mutateEditionCampus(nanoid(), { label: newLabel }, generateDummySuperAdmin());

      // You're not authorized to create campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Campus not found');
    }

    {
      const { data } = await mutateEditionCampus(
        dummyCampus._id,
        { label: newLabel },
        generateDummySuperAdmin(),
      );
      expect(data.editCampus).toHaveProperty('id', dummyCampus._id);
      expect(data.editCampus).toHaveProperty('label', newLabel);
      const dbVersion = await Campus.findOne({ _id: dummyCampus._id });
      expect(dbVersion).toMatchObject({ _id: dummyCampus._id, label: newLabel });
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Campus.findOneAndDelete({ _id: dummyCampus._id });
  }
});

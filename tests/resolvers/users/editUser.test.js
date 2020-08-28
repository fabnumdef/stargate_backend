import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import { ROLE_ACCESS_OFFICE, ROLE_SCREENING } from '../../../src/models/rules';

function mutateEditionUser(id, user, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
      mutation EditUserMutation($id: String!, $user: UserInput!) {
        editUser(id: $id, user: $user) {
          id
          firstname
          lastname
        }
      }
    `,
    variables: { id: id.toString(), user },
  });
}

it('Test to edit a user', async () => {
  const dummyUser = await createDummyUser({ roles: [{ role: ROLE_SCREENING }] });
  const newFirstname = nanoid();
  try {
    {
      const { errors } = await mutateEditionUser(dummyUser._id, {
        firstname: newFirstname,
        roles: [{ role: ROLE_ACCESS_OFFICE }],
      });

      // You're not authorized to edit user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await mutateEditionUser(
        dummyUser._id,
        { firstname: newFirstname, roles: [{ role: ROLE_ACCESS_OFFICE }] },
        generateDummySuperAdmin(),
      );
      expect(data.editUser).toHaveProperty('id', dummyUser.id);
      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(dbVersion.roles).toHaveLength(2);
    }
    {
      const { data } = await mutateEditionUser(
        dummyUser._id,
        { roles: [{ role: ROLE_ACCESS_OFFICE }] },
        generateDummySuperAdmin(),
      );
      expect(data.editUser).toHaveProperty('id', dummyUser.id);
      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(dbVersion).toMatchObject({ _id: dummyUser._id });
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

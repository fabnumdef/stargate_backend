import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';

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
  const dummyUser = await createDummyUser();
  const newFirstname = nanoid();
  try {
    {
      const { errors } = await mutateEditionUser(dummyUser._id, { firstname: newFirstname });

      // You're not authorized to edit user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await mutateEditionUser(
        dummyUser._id,
        { firstname: newFirstname },
        generateDummySuperAdmin(),
      );
      expect(data.editUser).toHaveProperty('id', dummyUser.id);
      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(dbVersion).toMatchObject({ _id: dummyUser._id, firstname: newFirstname });
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

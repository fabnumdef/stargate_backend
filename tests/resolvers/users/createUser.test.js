import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { generateDummyUser, generateDummySuperAdmin } from '../../models/user';

function mutateCreateUser(user, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
      mutation CreateUserMutation($user: UserInput!) {
        createUser(user: $user) {
          id
          firstname
          lastname
        }
      }
    `,
    variables: { user },
  });
}

it('Test to create a user', async () => {
  const dummyUser = generateDummyUser();

  try {
    {
      const { errors } = await mutateCreateUser({ firstname: dummyUser.firstname });

      // You're not authorized to create user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await mutateCreateUser(
        { firstname: dummyUser.firstname, email: dummyUser.email.original },
        generateDummySuperAdmin(),
      );
      expect(data.createUser).toHaveProperty('id');
      expect(data.createUser).toHaveProperty('firstname', dummyUser.firstname);
      const dbVersion = await User.findById(data.createUser.id);
      expect(dbVersion).toHaveProperty('firstname', dummyUser.firstname);
      expect(dbVersion).toHaveProperty('__v', 1);
      expect(dbVersion.tokens[0]).toHaveProperty('token');
    }
  } finally {
    await User.findOneAndDelete(dummyUser);
  }
});

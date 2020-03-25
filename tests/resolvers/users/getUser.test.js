import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';

function queryGetUser(id, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    query: gql`
      query GetUserQuery($id: String!) {
        getUser(id: $id) {
          id
          firstname
          lastname
        }
      }
    `,
    variables: { id: id.toString() },
  });
}

it('Test to get a user', async () => {
  const dummyUser = await createDummyUser();
  try {
    {
      const { errors } = await queryGetUser(dummyUser._id);

      // You're not authorized to create user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data } = await queryGetUser(
        dummyUser._id,
        generateDummySuperAdmin(),
      );
      expect(data.getUser).toHaveProperty('id', dummyUser.id);
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

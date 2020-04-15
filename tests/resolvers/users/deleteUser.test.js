import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';

function mutateDeleteUser(id, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
      mutation DeleteUserMutation($id: String!) {
          deleteUser(id: $id) {
              id,
              firstname
          }
      }
    `,
    variables: { id: id.toString() },
  });
}

it('Test to delete a user', async () => {
  const dummyUser = await createDummyUser();
  const fakeId = mongoose.Types.ObjectId();
  try {
    {
      const { errors } = await mutateDeleteUser(dummyUser._id);

      // You're not authorized to delete user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteUser(
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no user with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('User not found');
    }
    {
      const { data } = await mutateDeleteUser(
        dummyUser._id,
        generateDummySuperAdmin(),
      );
      expect(data.deleteUser).toHaveProperty('id', dummyUser.id);
      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(dbVersion).toBeNull();
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

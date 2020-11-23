import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';

function mutateDeleteUserRole(user, id, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
        mutation DeleteUserRoleMutation($user: UserInput! ,$id: ObjectID!) {
            deleteUserRole(user: $user, id: $id) {
                id
            }
        }
    `,
    variables: { user, id: id.toString() },
  });
}

it('Test to delete an user role', async () => {
  const userData = {
    roles: [
      { role: ROLE_UNIT_CORRESPONDENT },
    ],
  };
  const user = await createDummyUser(userData);
  const fakeId = mongoose.Types.ObjectId();

  try {
    {
      const { errors } = await mutateDeleteUserRole(userData, user._id);

      // You're not authorized to delete unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteUserRole(
        userData,
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no unit with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('User not found');
    }
    {
      const { data } = await mutateDeleteUserRole(
        userData,
        user._id,
        generateDummySuperAdmin(),
      );
      expect(data.deleteUserRole).toHaveProperty('id', user.id);
      const dbVersion = await User.findOne({ _id: user._id });
      expect(dbVersion.roles).toHaveLength(0);
    }
  } finally {
    await User.findOneAndDelete(({ _id: user._id }));
  }
});

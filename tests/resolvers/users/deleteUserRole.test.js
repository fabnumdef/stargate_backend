import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';
import Unit, { createDummyUnit } from '../../models/unit';

function mutateDeleteUserRole(roleData, id, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
        mutation DeleteUserRoleMutation($roleData: UserRoleInput! ,$id: ObjectID!) {
            deleteUserRole(roleData: $roleData, id: $id) {
                id
            }
        }
    `,
    variables: { roleData, id: id.toString() },
  });
}

it('Test to delete an user role', async () => {
  const unit1 = await createDummyUnit();
  const unit2 = await createDummyUnit();
  const userData = {
    roles: [
      { role: ROLE_UNIT_CORRESPONDENT, units: [unit1, unit2] },
    ],
  };
  const user = await createDummyUser(userData);
  const fakeId = mongoose.Types.ObjectId();

  try {
    {
      const { errors } = await mutateDeleteUserRole({ role: ROLE_UNIT_CORRESPONDENT }, user._id);

      // You're not authorized to delete unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteUserRole(
        { role: ROLE_UNIT_CORRESPONDENT },
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no unit with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('User not found');
    }
    {
      const { data } = await mutateDeleteUserRole(
        { role: ROLE_UNIT_CORRESPONDENT, unit: { id: unit1._id.toString() } },
        user._id,
        generateDummySuperAdmin(),
      );
      expect(data.deleteUserRole).toHaveProperty('id', user.id);
      const dbVersion = await User.findOne({ _id: user._id });
      expect(dbVersion.roles).toHaveLength(1);
    }
    {
      const { data } = await mutateDeleteUserRole(
        { role: ROLE_UNIT_CORRESPONDENT, unit: { id: unit2._id.toString() } },
        user._id,
        generateDummySuperAdmin(),
      );
      expect(data.deleteUserRole).toHaveProperty('id', user.id);
      const dbVersion = await User.findOne({ _id: user._id });
      expect(dbVersion.roles).toHaveLength(0);
    }
  } finally {
    await User.findOneAndDelete(({ _id: user._id }));
    await Unit.findOneAndDelete({ _id: unit1._id });
    await Unit.findOneAndDelete({ _id: unit2._id });
  }
});

import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';
import Unit, { createDummyUnit } from '../../models/unit';
import Campus, { createDummyCampus } from '../../models/campus';

function mutateAddUserRole(roleData, id, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    mutation: gql`
        mutation AddUserRoleMutation($roleData: UserRoleInput! ,$id: ObjectID!) {
            addUserRole(roleData: $roleData, id: $id) {
                id
            }
        }
    `,
    variables: { roleData, id: id.toString() },
  });
}

it('Test to add an user role', async () => {
  const campus = await createDummyCampus();
  const unit1 = await createDummyUnit();
  const unit2 = await createDummyUnit();
  const user = await createDummyUser();
  const fakeId = mongoose.Types.ObjectId();

  const roleData = { role: ROLE_UNIT_CORRESPONDENT, campus: { id: campus._id.toString(), label: campus.label } };

  try {
    {
      const { errors } = await mutateAddUserRole(
        { ...roleData, unit: { id: unit1._id.toString(), label: unit1.label } },
        user._id,
      );

      // You're not authorized to delete unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateAddUserRole(
        { ...roleData, unit: { id: unit1._id.toString(), label: unit1.label } },
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no unit with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('User not found');
    }
    {
      const { data } = await mutateAddUserRole(
        { ...roleData, unit: { id: unit1._id.toString(), label: unit1.label } },
        user._id,
        generateDummySuperAdmin(),
      );
      expect(data.addUserRole).toHaveProperty('id', user.id);
      const dbVersion = await User.findOne({ _id: user._id });
      expect(dbVersion.roles).toHaveLength(1);
    }
    {
      const { data } = await mutateAddUserRole(
        { ...roleData, unit: { id: unit2._id.toString(), label: unit2.label } },
        user._id,
        generateDummySuperAdmin(),
      );
      expect(data.addUserRole).toHaveProperty('id', user.id);
      const dbVersion = await User.findOne({ _id: user._id });
      expect(dbVersion.roles[0].units).toHaveLength(2);
    }
  } finally {
    await User.findOneAndDelete({ _id: user._id });
    await Unit.findOneAndDelete({ _id: unit1._id });
    await Unit.findOneAndDelete({ _id: unit2._id });
    await Campus.findOneAndDelete({ _id: campus._id });
  }
});

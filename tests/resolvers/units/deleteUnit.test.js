import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import Unit, { createDummyUnit } from '../../models/unit';
import { createDummyCampus } from '../../models/campus';
import Place, { createDummyPlace } from '../../models/place';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';

const { Types: { ObjectId } } = mongoose;

function mutateDeleteUnit(campusId, id, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation DeleteUnitMutation($campusId: String!, $id: String!) {
            mutateCampus(id: $campusId) {
                deleteUnit(id: $id) {
                    id
                    label
                }
            }
        }
    `,
    variables: { campusId, id: id.toString() },
  });
}

it('Test to delete an unit', async () => {
  const campus = await createDummyCampus();
  const dummyUnit = await createDummyUnit({ campus });

  const place = await createDummyPlace({ unitInCharge: { _id: dummyUnit._id } });
  const userId = new ObjectId();
  const userInCharge = await createDummyUser({
    _id: userId,
    roles: [
      { role: ROLE_UNIT_CORRESPONDENT, userInCharge: userId, units: [{ _id: dummyUnit._id, label: dummyUnit.label }] },
    ],
  });
  const fakeId = mongoose.Types.ObjectId();

  try {
    {
      const { errors } = await mutateDeleteUnit(campus._id, dummyUnit._id);

      // You're not authorized to delete unit while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised!');
    }
    {
      const { errors } = await mutateDeleteUnit(
        campus._id,
        fakeId,
        generateDummySuperAdmin(),
      );
      // Found no unit with this id
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Unit not found');
    }
    {
      const { data } = await mutateDeleteUnit(
        campus._id,
        dummyUnit._id,
        generateDummySuperAdmin(),
      );
      expect(data.mutateCampus.deleteUnit).toHaveProperty('id', dummyUnit.id);
      const dbVersion = await Unit.findOne({ _id: dummyUnit._id });
      expect(dbVersion).toBeNull();
      const placeDbVersion = await Place.findOne({ _id: place._id });
      expect(placeDbVersion.unitInCharge).not.toBe(dummyUnit._id);
      const userDbVersion = await User.findOne({ _id: userId });
      expect(userDbVersion.roles).toHaveLength(0);
    }
  } finally {
    await Unit.findOneAndDelete({ _id: dummyUnit._id });
    await Place.findOneAndDelete(({ _id: place._id }));
    await User.findOneAndDelete(({ _id: userInCharge._id }));
  }
});

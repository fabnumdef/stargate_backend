import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateEditMe(user, me) {
  const { mutate } = queryFactory(me);
  return mutate({
    mutation: gql`
        mutation EditMeMutation($user: UserInput!) {
            editMe(user: $user) {
                id
                firstname
                lastname
            }
        }
    `,
    variables: { user },
  });
}

it('Test to edit a user', async () => {
  const dummyUser = await createDummyUser();
  const newFirstname = nanoid();
  try {
    {
      const { errors } = await mutateEditMe({ firstname: newFirstname });

      // You're not authorized to edit user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { editMe } } = await mutateEditMe(
        { firstname: newFirstname },
        { id: dummyUser._id },
      );

      expect(editMe).toHaveProperty('id', dummyUser.id);
      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(dbVersion).toMatchObject({ _id: dummyUser._id, firstname: newFirstname });
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

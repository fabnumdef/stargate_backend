import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateEditMe(user, password, me) {
  const { mutate } = queryFactory(me);
  return mutate({
    mutation: gql`
        mutation EditMeMutation($user: OwnUserInput!, $password: String!) {
            editMe(user: $user, currentPassword: $password) {
                id
                firstname
                lastname
            }
        }
    `,
    variables: { user, password },
  });
}

it('Test to user edit himself', async () => {
  const password = nanoid();
  const dummyUser = await createDummyUser({ password });
  const newFirstname = nanoid();
  try {
    {
      const { errors } = await mutateEditMe({ firstname: newFirstname }, dummyUser.password);

      // You're not authorized to edit user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await mutateEditMe(
        { firstname: newFirstname },
        'bad password',
        { id: dummyUser._id },
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Invalid password');
    }

    {
      const { data: { editMe } } = await mutateEditMe(
        { firstname: newFirstname },
        password,
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

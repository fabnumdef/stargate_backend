import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function queryGetMe(me) {
  const { mutate } = queryFactory(me);
  return mutate({
    query: gql`
        query getMe {
            me {
                id
            }
        }
    `,
  });
}

it('Test to get himself', async () => {
  const dummyUser = await createDummyUser();
  try {
    {
      const { errors } = await queryGetMe();

      // You're not authorized to get user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { me } } = await queryGetMe(
        { id: dummyUser._id },
      );

      expect(me).toHaveProperty('id', dummyUser.id);
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function queryGetMe(userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    query: gql`
        query GetMeQuery {
            me {
                id
            }
        }
    `,
  });
}

it('Test to get me', async () => {
  const dummyUser = await createDummyUser();
  try {
    const { data } = await queryGetMe(
      dummyUser,
    );
    expect(data.me).toHaveProperty('id', dummyUser.id);
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

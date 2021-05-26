import queryFactory, { gql } from '../../helpers/apollo-query';

import User, { createDummyUser } from '../../models/user';

function mutateFindUser(email) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation findUser($email: EmailAddress!) {
          findUser(email: $email) {
            id
            firstname
            lastname
            email {
                original
            }
          }
        }
    `,
    variables: { email },
  });
}

it('Find a user by email', async () => {
  const dummyUser = await createDummyUser();

  try {
    const { data: { findUser } } = await mutateFindUser(dummyUser.email.original);

    // const findUserByEmail = await User.findOne({ 'email.canonical': dummyUser.email.canonical });

    expect(findUser.id).toStrictEqual(dummyUser._id.toString());

    const dbVersion = await User.findOne({ _id: dummyUser._id });

    expect(dbVersion.email.original).toBe(dummyUser.email.original);
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

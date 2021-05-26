import queryFactory, { gql } from '../../helpers/apollo-query';

import User, { createDummyUser } from '../../models/user';

function mutateFindUser(email) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation findUser($email: EmailAddress!) {
          findUser(email: $email) {
            _id
            firstname
            lastname
            email
          }
        }
    `,
    variables: { email },
  });
}

it('Find a user by email', async () => {
  const dummyUser = await createDummyUser();

  try {
    const { findUserByEmail } = await mutateFindUser(dummyUser.email.canonical);

    // const findUserByEmail = await User.findOne({ 'email.canonical': dummyUser.email.canonical });

    expect(findUserByEmail._id).toStrictEqual(dummyUser._id);

    const dbVersion = await User.findOne({ _id: dummyUser._id });

    expect(dbVersion.email.canonical).toBe(dummyUser.email.canonical);
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

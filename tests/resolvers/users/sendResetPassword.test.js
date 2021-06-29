import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateSendResetPassword(email) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation sendResetPassword($email: EmailAddress!) {
            sendResetPassword(email: $email)
        }
    `,
    variables: { email },
  });
}

it('Return true if sending reset password of non-existing user', async () => {
  const fakeEmail = `${nanoid()}@localhost`;

  const { data: { sendResetPassword } } = await mutateSendResetPassword(fakeEmail);
  expect(sendResetPassword).toBe(true);
});

it('Generate a reset token and send email', async () => {
  const dummyUser = await createDummyUser();
  try {
    const { data: { sendResetPassword } } = await mutateSendResetPassword(dummyUser.email.canonical);
    expect(sendResetPassword).toBe(true);

    const dbVersion = await User.findOne({ _id: dummyUser._id });
    expect(dbVersion.tokens[0].email).toBe(dummyUser.email.canonical);
    expect(dbVersion.tokens[0]).toHaveProperty('token');
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

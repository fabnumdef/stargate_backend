import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateResetPassword(email) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation resetPassword($email: EmailAddress!) {
            resetPassword(email: $email)
        }
    `,
    variables: { email },
  });
}

it('Return true if reset password of non-existing user', async () => {
  const fakeEmail = `${nanoid()}@localhost`;

  const { data: { resetPassword } } = await mutateResetPassword(fakeEmail);
  expect(resetPassword).toBe(true);
});

it('Generate a reset token and send email', async () => {
  const dummyUser = await createDummyUser();
  try {
    const { data: { resetPassword } } = await mutateResetPassword(dummyUser.email.canonical);
    expect(resetPassword).toBe(true);

    const dbVersion = await User.findOne({ _id: dummyUser._id });
    expect(dbVersion.tokens[0].email).toBe(dummyUser.email.canonical);
    expect(dbVersion.tokens[0]).toHaveProperty('token');
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateResetPassword(email) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation resetPassword($email: EmailAddress!) {
            resetPassword(email: $email) {
                id
            }
        }
    `,
    variables: { email },
  });
}

it('Throw error if reset password of non-existing user', async () => {
  const fakeEmail = `${nanoid()}@test.com`;

  const { errors } = await mutateResetPassword(fakeEmail);

  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain('User not found');
});

it('Generate a reset token and send email', async () => {
  const dummyUser = await createDummyUser();
  try {
    const { data: { resetPassword } } = await mutateResetPassword(dummyUser.email.canonical);

    expect(resetPassword).toHaveProperty('id');

    const dbVersion = await User.findOne({ _id: dummyUser._id });
    expect(dbVersion.tokens[0].email).toBe(dummyUser.email.canonical);
    expect(dbVersion.tokens[0]).toHaveProperty('token');
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

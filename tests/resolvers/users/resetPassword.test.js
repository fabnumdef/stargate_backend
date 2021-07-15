import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser } from '../../models/user';

function mutateResetPassword(email, token, password) {
  const { mutate } = queryFactory();
  return mutate({
    mutation: gql`
        mutation resetPassword($email: EmailAddress!, $token: String!, $password: String!) {
            resetPassword(email: $email, token: $token, password: $password)
        }
    `,
    variables: { email, token, password },
  });
}

it('Return true if reset password of non-existing user', async () => {
  const fakeEmail = `${nanoid()}@localhost`;

  const { data: { resetPassword } } = await mutateResetPassword(fakeEmail, 'token', 'password');
  expect(resetPassword).toBe(true);
});

it('Try to reset password', async () => {
  const dummyUser = await createDummyUser();
  const { token } = await dummyUser.generateResetToken({ email: dummyUser.email.canonical });
  await dummyUser.save();
  const password = nanoid();
  try {
    {
      const { errors } = await mutateResetPassword(dummyUser.email.canonical, 'badToken', password);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Expired link');

      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(await dbVersion.comparePassword(password)).toBe(false);
    }
    {
      const { data: { resetPassword } } = await mutateResetPassword(dummyUser.email.canonical, token, password);
      expect(resetPassword).toBe(true);

      const dbVersion = await User.findOne({ _id: dummyUser._id });
      expect(await dbVersion.comparePassword(password)).toBe(true);
      expect(dbVersion.tokens[0].email).toBe(dummyUser.email.canonical);
      expect(dbVersion.tokens[0]).toHaveProperty('token');
    }
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

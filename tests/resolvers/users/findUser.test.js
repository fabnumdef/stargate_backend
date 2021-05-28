import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';

import User, { createDummyUser } from '../../models/user';
import { ROLE_ADMIN } from '../../../src/models/rules';

function queryFindUser(email, userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    query: gql`
        query FindUserQuery($email: EmailAddress!) {
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

it('Test User not found with fake email', async () => {
  const fakeEmail = `${nanoid()}@localhost`;

  const { errors } = await queryFindUser(fakeEmail, { roles: [{ role: ROLE_ADMIN }] });
  // can't find fakeEmail
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain('User not found');
});

it('Test to find a user by email, with no role', async () => {
  const dummyUser = await createDummyUser();

  try {
    const { errors } = await queryFindUser(dummyUser.email.original);
    // You're not authorized to find user while without rights
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Not Authorised');
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

it('Test to find a user by email, admin role', async () => {
  const dummyUser = await createDummyUser();

  try {
    const { data: { findUser } } = await queryFindUser(dummyUser.email.original, { roles: [{ role: ROLE_ADMIN }] });

    expect(findUser.id).toStrictEqual(dummyUser._id.toString());

    const dbVersion = await User.findOne({ _id: dummyUser._id });

    expect(dbVersion.email.original).toBe(dummyUser.email.original);
  } finally {
    await User.findOneAndDelete({ _id: dummyUser._id });
  }
});

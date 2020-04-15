import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { createDummyUser } from '../../models/user';

const JWT_REFRESH_MUTATION = gql`
    mutation jwtRefreshMutation {
        jwtRefresh {
            jwt
        }
    }
`;

function refreshJwt(user) {
  const { query } = queryFactory(user);
  return query({ query: JWT_REFRESH_MUTATION });
}

it('Test to resfresh with user not found', async () => {
  const fakeUserData = { user: { _id: nanoid() } };
  const { errors } = await refreshJwt(fakeUserData);

  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain('User not found');
});

it('Test to refresh jwt with existing user', async () => {
  const user = await createDummyUser();
  try {
    const { data: { jwtRefresh: { jwt } } } = await refreshJwt(user);
    expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
  } finally {
    await user.deleteOne();
  }
});

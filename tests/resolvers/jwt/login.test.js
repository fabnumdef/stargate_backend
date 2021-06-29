import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyUser, createDummyUser } from '../../models/user';

const JWT_LOGIN_QUERY = gql`
    mutation loginQuery($email: EmailAddress!, $password: String!) {
        login(email: $email, password: $password) {
            jwt
        }
    }
`;

function queryJwt(email, password) {
  const { query } = queryFactory();
  return query({ query: JWT_LOGIN_QUERY, variables: { email, password } });
}

it('Test to login errors', async () => {
  const user = generateDummyUser();
  const password = nanoid();
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const userPassExpired = await createDummyUser({ password, passwordExpiration: date });
  {
    const { errors } = await queryJwt(user.email.original, user.password);
    expect(errors).toHaveLength(1);
  }
  {
    const { errors } = await queryJwt(userPassExpired.email.original, password);
    expect(errors[0].message).toBe('Password expired');
  }
});

it('Test to login existing user', async () => {
  const password = nanoid();
  const user = await createDummyUser({ password });
  try {
    {
      const { data: { login: { jwt } } } = await queryJwt(user.email.original, password);
      expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    }
    {
      const { errors } = await queryJwt(user.email.original, 'WrongPassword');
      expect(errors).toHaveLength(1);
    }
  } finally {
    await user.deleteOne();
  }
});

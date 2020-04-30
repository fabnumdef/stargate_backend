import { customAlphabet, nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyUser, createDummyUser } from '../../models/user';

const JWT_LOGIN_QUERY = gql`
    mutation ScratchQuery($email: EmailAddress!, $password: String, $token: String) {
        login(email: $email, password: $password, token: $token) {
            jwt
        }
    }
`;

function queryJwt(email, password, token) {
  const { query } = queryFactory();
  return query({ query: JWT_LOGIN_QUERY, variables: { email, password, token } });
}

it('Test to login unexisting user', async () => {
  const user = generateDummyUser();
  const { errors } = await queryJwt(user.email.original, user.password);

  expect(errors).toHaveLength(1);
});

it('Test to login existing user', async () => {
  const password = nanoid();
  const user = await createDummyUser({ password });
  try {
    {
      const { data: { login: { jwt } } } = await queryJwt(user.email.original, password, null);
      expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    }
    {
      const { errors } = await queryJwt(user.email.original, 'WrongPassword', null);
      expect(errors).toHaveLength(1);
    }
  } finally {
    await user.deleteOne();
  }
});

it('Test to login user in reset password case', async () => {
  const mail = `${nanoid()}@localhost`;
  const generateToken = customAlphabet('123456789abcdefg', 6);
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + 60);
  const mockedToken = {
    expiration,
    email: mail,
    token: generateToken(),
  };
  const params = {
    email: { original: mail },
    tokens: [mockedToken],
  };

  const user = await createDummyUser(params);
  const fakeToken = generateToken();

  try {
    {
      const { data: { login: { jwt } } } = await queryJwt(user.email.original, null, mockedToken.token);
      expect(jwt).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    }
    {
      const { errors } = await queryJwt(user.email.original, null, fakeToken);
      expect(errors).toHaveLength(1);
    }
  } finally {
    await user.deleteOne();
  }
});

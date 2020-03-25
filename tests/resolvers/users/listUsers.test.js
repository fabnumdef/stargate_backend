import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';

function queryListUser(userRole = null) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    query: gql`
      query ListUserQuery {
        listUsers {
          list {
            id
            firstname
            lastname
          }
          meta {
            offset
            first
            total
          }
        }
      }
    `,
    variables: { },
  });
}

beforeAll(async () => {
  await User.deleteMany({});
});

it('Test to list users', async () => {
  const list = await Promise.all(Array.from({ length: 5 }).map(() => createDummyUser()));
  try {
    {
      const { errors } = await queryListUser();

      // You're not authorized to create user while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { listUsers } } = await queryListUser(
        generateDummySuperAdmin(),
      );
      // Check default values
      expect(listUsers.list).toHaveLength(list.length);
      expect(listUsers.meta).toMatchObject({
        total: list.length,
        first: 30,
        offset: 0,
      });
    }
  } finally {
    await User.deleteMany({ _id: list.map((c) => c._id) });
  }
});

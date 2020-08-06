import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummySuperAdmin } from '../../models/user';
import { ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';

function queryListUser(userRole = null, hasRole) {
  const { mutate } = queryFactory(userRole);
  return mutate({
    query: gql`
      query ListUserQuery($hasRole: String) {
        listUsers(hasRole: $hasRole) {
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
    variables: { hasRole },
  });
}

beforeAll(async () => {
  await User.deleteMany({});
});

it('Test to list users', async () => {
  const list = await Promise.all(Array.from({ length: 5 }).map(() => createDummyUser()));
  const userWithRole = await createDummyUser({
    roles: [
      { role: ROLE_UNIT_CORRESPONDENT },
    ],
  });
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
      expect(listUsers.list).toHaveLength(list.length + 1);
      expect(listUsers.meta).toMatchObject({
        total: list.length + 1,
        first: 30,
        offset: 0,
      });
    }
    {
      const { data: { listUsers } } = await queryListUser(
        generateDummySuperAdmin(),
        ROLE_UNIT_CORRESPONDENT,
      );
      // Check default values
      expect(listUsers.list).toHaveLength(1);
      expect(listUsers.meta).toMatchObject({
        total: 1,
        first: 30,
        offset: 0,
      });
    }
  } finally {
    await User.deleteMany({ _id: list.map((c) => c._id) });
    await User.findOneAndDelete(({ _id: userWithRole._id }));
  }
});

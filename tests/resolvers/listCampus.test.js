import queryFactory, { gql } from '../helpers/apollo-query';
import { generateDummySuperAdmin } from '../models/user';
import Campus, { createDummyCampus } from '../models/campus';

function queryListCampus(user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
      query ListCampusQuery {
        listCampuses {
          list {
            id
            label
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

it('Test to list campuses', async () => {
  const list = await Promise.all(Array.from({ length: 5 }).map(() => createDummyCampus()));
  try {
    {
      const { errors } = await queryListCampus();

      // You're not authorized to create campus while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { listCampuses } } = await queryListCampus(
        generateDummySuperAdmin(),
      );
      // Check default values
      expect(listCampuses.list).toHaveLength(list.length);
      expect(listCampuses.meta).toMatchObject({
        total: list.length,
        first: 30,
        offset: 0,
      });
    }
  } finally {
    await Campus.deleteMany({ _id: list.map((c) => c._id) });
  }
});

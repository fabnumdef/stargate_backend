import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { createDummyUser, generateDummyUser } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';
import Request, { createDummyRequest } from '../../models/request';
import Unit, { createDummyUnit } from '../../models/unit';
import Place, { createDummyPlace } from '../../models/place';

function queryListMyRequests(campusId, search, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
        query ListMyRequestsQuery($campusId: String!, $search: String) {
            getCampus(id: $campusId) {
                listMyRequests(search: $search) {
                    list {
                        id
                    }
                    meta {
                        offset
                        first
                        total
                    }
                }
            }
        }
    `,
    variables: { campusId, search },
  });
}

beforeAll(async () => {
  await Request.deleteMany({});
});

it('Test to list my requests', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit();
  const user = await createDummyUser();
  const place = await createDummyPlace({ unitInCharge: unit });
  await Promise.all(Array.from({ length: 1 })
    .map(() => createDummyRequest({ campus, owner: generateDummyUser({ unit }), places: [place] })));
  const list = await Promise.all(
    Array.from({ length: 5 })
      .map(() => createDummyRequest({ campus, owner: { ...user.toObject(), unit }, places: [place] })),
  );

  try {
    {
      const { errors } = await queryListMyRequests(campus._id);

      // You're not authorized to query requests list while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listMyRequests } } } = await queryListMyRequests(
        campus._id,
        null,
        user,
      );

      // Check default values
      expect(listMyRequests.list).toHaveLength(list.length);
      expect(listMyRequests.meta).toMatchObject({
        total: list.length,
        first: 50,
        offset: 0,
      });
    }

    {
      const { data: { getCampus: { listMyRequests } } } = await queryListMyRequests(
        campus._id,
        list[0].reason,
        user,
      );

      // Check default values
      expect(listMyRequests.list).toHaveLength(1);
      expect(listMyRequests.meta).toMatchObject({
        total: 1,
        first: 50,
        offset: 0,
      });
    }
  } finally {
    await Request.deleteMany();
    await Place.deleteOne({ _id: place.id });
    await Unit.deleteOne({ _id: unit.id });
    await Campus.deleteOne({ _id: campus._id });
    await User.deleteOne({ _id: user._id });
  }
});

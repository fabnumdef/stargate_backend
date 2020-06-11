import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';
import Request, { createDummyRequest } from '../../models/request';
import Unit, { createDummyUnit } from '../../models/unit';
import Place, { createDummyPlace } from '../../models/place';

function queryListRequests(campusId, as, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
        query ListRequestsQuery($campusId: String!, $as: ValidationPersonas!) {
            getCampus(id: $campusId) {
                listRequests(as: $as) {
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
    variables: { campusId, as },
  });
}

beforeAll(async () => {
  await Request.deleteMany({});
});

it('Test to list requests', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const unit1 = await createDummyUnit();
  const unit2 = await createDummyUnit();
  const place1 = await createDummyPlace({ unitInCharge: unit1 });
  const place2 = await createDummyPlace({ unitInCharge: unit2 });
  await Promise.all(Array.from({ length: 1 })
    .map(() => createDummyRequest({ campus, owner, places: [place2] })));
  const list = await Promise.all(
    Array.from({ length: 5 })
      .map(() => createDummyRequest({ campus, owner, places: [place1] })),
  );

  try {
    {
      const { errors } = await queryListRequests(campus._id, { unit: unit1.label });

      // You're not authorized to query requests list while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { getCampus: { listRequests } } } = await queryListRequests(
        campus._id,
        { unit: unit1.label },
        generateDummyAdmin(),
      );

      // Check default values
      expect(listRequests.list).toHaveLength(list.length);
      expect(listRequests.meta).toMatchObject({
        total: list.length,
        first: 10,
        offset: 0,
      });
    }
  } finally {
    await Request.deleteMany();
    await Place.deleteMany();
    await Unit.deleteMany();
    await Campus.deleteOne({ _id: campus._id });
  }
});

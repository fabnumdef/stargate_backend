import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Campus, { createDummyCampus } from '../../models/campus';
import Request, { createDummyRequest } from '../../models/request';
import Unit, { createDummyUnit } from '../../models/unit';
import Place, { createDummyPlace } from '../../models/place';
import { ROLE_ACCESS_OFFICE } from '../../../src/models/rules';

function queryListRequests(campusId, as, search = null, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    query: gql`
        query ListRequestsQuery($campusId: String!, $as: ValidationPersonas!, $search: String) {
            getCampus(id: $campusId) {
                listRequests(as: $as, search: $search) {
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
    variables: { campusId, as, search },
  });
}

beforeAll(async () => {
  await Request.deleteMany({});
});

it('Test to list requests', async () => {
  const campus = await createDummyCampus();
  const unit1 = await createDummyUnit({ workflow: { steps: [{ role: ROLE_ACCESS_OFFICE }] } });
  const unit2 = await createDummyUnit();
  const owner = await generateDummyUser({ unit: unit1 });
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
        { role: ROLE_ACCESS_OFFICE },
        null,
        generateDummyAdmin(),
      );

      // Check default values
      expect(listRequests.list).toHaveLength(list.length);
      expect(listRequests.meta).toMatchObject({
        total: list.length,
        first: 50,
        offset: 0,
      });
    }

    {
      const { data: { getCampus: { listRequests } } } = await queryListRequests(
        campus._id,
        { role: ROLE_ACCESS_OFFICE },
        list[0].reason,
        generateDummyAdmin(),
      );

      // Check default values
      expect(listRequests.list).toHaveLength(1);
      expect(listRequests.meta).toMatchObject({
        total: 1,
        first: 50,
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

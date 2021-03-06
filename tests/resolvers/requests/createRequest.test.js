import { DateTime } from 'luxon';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { generateDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import { createDummyUnit } from '../../models/unit';

function mutateCreateRequest(campusId, request, unit, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation CreateRequestMutation($campusId: String!, $request: RequestInput!, $unit: RequestOwnerUnitInput!) {
        mutateCampus(id: $campusId) {
          createRequest(request: $request, unit: $unit) {
            id
          }
        }
      }
    `,
    variables: { campusId, request, unit },
  });
}

jest.setTimeout(30000);
it('Test to create a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const unit = await createDummyUnit();

  const dummyRequest = generateDummyRequest();

  try {
    {
      const { errors } = await mutateCreateRequest(
        campus._id,
        dummyRequest,
        { id: unit._id.toString(), label: unit.label },
      );

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { data: { mutateCampus: { createRequest: createdRequest } } } = await mutateCreateRequest(
        campus._id,
        {
          ...dummyRequest,
          from: dummyRequest.from.toISOString(),
          to: dummyRequest.to.toISOString(),
        },
        { id: unit._id.toString(), label: unit.label },
        generateDummyAdmin(owner),
      );
      expect(createdRequest).toHaveProperty('id');
      const dbVersion = await Request.findById(createdRequest.id);

      expect(DateTime.fromJSDate(dbVersion.from).toFormat('HH:mm')).toEqual('07:00');
      expect(DateTime.fromJSDate(dbVersion.to).toFormat('HH:mm')).toEqual('19:00');

      expect(dbVersion).toHaveProperty('campus._id', campus._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Request.findOneAndDelete(dummyRequest);
    await campus.deleteOne();
    await unit.deleteOne();
  }
});

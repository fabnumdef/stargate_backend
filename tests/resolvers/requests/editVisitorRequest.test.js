import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor, generateDummyVisitor } from '../../models/visitor';

function mutateEditVisitorRequest(campusId, requestId, visitorData, visitorId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation editVisitorRequestMutation(
            $campusId: String!,
            $requestId: String!,
            $visitorData: RequestVisitorInput!,
            $visitorId: String!
        ) {
            mutateCampus(id: $campusId) {
                mutateRequest(id: $requestId) {
                    editVisitor(visitor: $visitorData, id: $visitorId) {
                        id
                        firstname
                    }
                }
            }
        }
    `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
      visitorData,
      visitorId: visitorId.toString ? visitorId.toString() : visitorId,
    },
  });
}

it('Test to edit a visitor', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitorParams = {
    request: dummyRequest,
  };

  const visitor = await createDummyVisitor(visitorParams);
  const visitorData = generateDummyVisitor();
  const fakeId = new mongoose.Types.ObjectId();

  try {
    {
      const { errors } = await mutateEditVisitorRequest(campus._id, dummyRequest._id, visitorData, visitor.id);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await mutateEditVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitorData,
        fakeId,
        generateDummyAdmin(),
      );

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Visitor not found');
    }

    {
      const { data: { mutateCampus: { mutateRequest: { editVisitor } } } } = await mutateEditVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitorData,
        visitor.id,
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(editVisitor.id);
      expect(dbVersion).toMatchObject({
        firstname: visitorData.firstname,
      });
      expect(dbVersion).toHaveProperty('__v', 1);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
    await Visitor.findOneAndDelete({ _id: visitor.id });
  }
});

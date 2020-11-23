import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor } from '../../models/visitor';
import { ID_DOCUMENT_PASSPORT } from '../../../src/models/visitor';

function mutateRemoveVisitorRequest(campusId, requestId, visitorId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation RemoveVisitorRequestMutation($campusId: String!, $requestId: String!, $visitorId: ObjectID!) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            deleteVisitor(id: $visitorId) {
              id
            }
          }
        }
      }
    `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
      visitorId: visitorId.toString ? visitorId.toString() : visitorId,
    },
  });
}

it('Test to remove a visitor from a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitor = await createDummyVisitor({
    request: dummyRequest,
    identityDocuments: [{
      kind: ID_DOCUMENT_PASSPORT,
      reference: nanoid(),
      file: {
        id: new mongoose.Types.ObjectId(),
        filename: nanoid(),
        original: nanoid(),
      },
    }],
  });
  try {
    {
      const { errors } = await mutateRemoveVisitorRequest(campus._id, dummyRequest._id, visitor._id.toString());

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }
    {
      const { errors } = await mutateRemoveVisitorRequest(
        campus._id,
        dummyRequest._id,
        new mongoose.Types.ObjectId(),
        generateDummyAdmin(),
      );

      // You're should not get a visitor that not exists.
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Visitor not found');
    }
    {
      const { data: { mutateCampus: { mutateRequest: { deleteVisitor } } } } = await mutateRemoveVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitor._id,
        generateDummyAdmin(),
      );
      expect(deleteVisitor).toHaveProperty('id', visitor._id.toString());
      const dbVersion = await Visitor.findOne({ _id: visitor._id });
      expect(dbVersion).toBeNull();
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});

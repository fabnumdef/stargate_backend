import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import Campus, { createDummyCampus } from '../../models/campus';
import Visitor, { createDummyVisitor, generateDummyVisitor } from '../../models/visitor';
import { ID_DOCUMENT_PASSPORT, ID_DOCUMENT_IDCARD } from '../../../src/models/visitor';
import { fileUpload, fileUploadError } from '../../helpers/file-upload';

function mutateEditVisitorRequest(campusId, requestId, visitorData, visitorId, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation editVisitorRequestMutation(
            $campusId: String!,
            $requestId: String!,
            $visitorData: RequestVisitorInput!,
            $visitorId: ObjectID!
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

it('Test to edit a visitor with new uploaded file', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const visitorParams = {
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
  };

  const visitor = await createDummyVisitor(visitorParams);

  const visitorData = generateDummyVisitor({
    identityDocuments: {
      kind: ID_DOCUMENT_PASSPORT,
      reference: nanoid(),
    },
    file: fileUpload,
  });
  const visitorData2 = generateDummyVisitor({
    identityDocuments: [{
      kind: ID_DOCUMENT_PASSPORT,
      reference: nanoid(),
    }],
  });
  const visitorData3 = generateDummyVisitor({
    identityDocuments: [{
      kind: ID_DOCUMENT_IDCARD,
      reference: nanoid(),
    }],
    file: fileUpload,
  });
  const visitorError = await generateDummyVisitor();
  visitorError.identityDocuments = [{
    kind: ID_DOCUMENT_PASSPORT,
    reference: nanoid(),
  }];
  visitorError.file = fileUploadError;
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
        visitorError,
        visitor.id,
        generateDummyAdmin(),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('File upload error');
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
      // Test with new uploaded file
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
    {
      // Test without new uploaded file
      const { data: { mutateCampus: { mutateRequest: { editVisitor } } } } = await mutateEditVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitorData2,
        visitor.id,
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(editVisitor.id);
      expect(dbVersion.identityDocuments[0]).toHaveProperty('reference', visitorData2.identityDocuments[0].reference);
      expect(dbVersion).toHaveProperty('__v', 2);
    }
    {
      // Test without new uploaded file, but another kind
      const { data: { mutateCampus: { mutateRequest: { editVisitor } } } } = await mutateEditVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitorData3,
        visitor.id,
        generateDummyAdmin(),
      );
      const dbVersion = await Visitor.findById(editVisitor.id);
      expect(dbVersion.identityDocuments).toHaveLength(1);
      expect(dbVersion).toHaveProperty('__v', 3);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await Campus.findOneAndDelete({ _id: campus._id });
    await Visitor.findOneAndDelete({ _id: visitor.id });
  }
});

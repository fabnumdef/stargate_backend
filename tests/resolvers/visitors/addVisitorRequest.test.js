import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import User, { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import Campus, { createDummyCampus } from '../../models/campus';
import Visitor, { generateDummyVisitor } from '../../models/visitor';
import { ID_DOCUMENT_PASSPORT } from '../../../src/models/visitor';
import { fileUploadError, imageUpload } from '../../helpers/file-upload';
import { ROLE_SCREENING, ROLE_UNIT_CORRESPONDENT } from '../../../src/models/rules';
import { createDummyUnit } from '../../models/unit';
import {
  WORKFLOW_BEHAVIOR_ADVISEMENT,
  WORKFLOW_BEHAVIOR_VALIDATION, WORKFLOW_DECISION_ACCEPTED,
} from '../../../src/models/unit';
import { createDummyPlace } from '../../models/place';

function mutatecreateVisitorRequest(campusId, requestId, visitor, as, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
      mutation createVisitorRequestMutation(
          $campusId: String!,
          $requestId: String!,
          $visitor: RequestVisitorInput!,
          $as: ValidationPersonas!,
      ) {
        mutateCampus(id: $campusId) {
          mutateRequest(id: $requestId) {
            createVisitor(visitor: $visitor, as: $as) {
              id
              identityDocuments {
                  kind
                  reference
                  file {
                      id
                  }
              }
            }
          }
        }
      }
        `,
    variables: {
      campusId,
      requestId: requestId.toString ? requestId.toString() : requestId,
      visitor,
      as,
    },
  });
}

it('Test to add a visitor to a request', async () => {
  const campus = await createDummyCampus();
  const unit = await createDummyUnit({
    campus,
    workflow: {
      steps: [
        {
          role: ROLE_UNIT_CORRESPONDENT,
          behavior: WORKFLOW_BEHAVIOR_VALIDATION,
        },
        {
          role: ROLE_SCREENING,
          behavior: WORKFLOW_BEHAVIOR_ADVISEMENT,
        },
      ],
    },
  });
  const place = await createDummyPlace({ unitInCharge: unit });
  const owner = await generateDummyUser({ unit });
  const dummyRequest = await createDummyRequest({ campus, owner, places: [place] });
  const as = { role: ROLE_UNIT_CORRESPONDENT };
  const visitor = await generateDummyVisitor({
    identityDocuments: {
      kind: ID_DOCUMENT_PASSPORT,
      reference: nanoid(),
    },
    file: imageUpload,
  });

  const visitorError = await generateDummyVisitor({
    identityDocuments: {
      kind: ID_DOCUMENT_PASSPORT,
      reference: nanoid(),
    },
    file: fileUploadError,
  });

  try {
    {
      const { errors } = await mutatecreateVisitorRequest(campus._id, dummyRequest._id, visitor, as);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await mutatecreateVisitorRequest(campus._id, nanoid(), visitor, as, generateDummyAdmin());

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Request not found');
    }

    {
      const { errors } = await mutatecreateVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitorError,
        as,
        generateDummyAdmin(),
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('File upload error');
    }

    {
      const { data: { mutateCampus: { mutateRequest: { createVisitor } } } } = await mutatecreateVisitorRequest(
        campus._id,
        dummyRequest._id,
        visitor,
        as,
        generateDummyAdmin(),
      );
      expect(createVisitor).toHaveProperty('id');
      const dbVersion = await Visitor.findById(createVisitor.id);
      expect(dbVersion).toMatchObject({
        firstname: visitor.firstname,
        usageLastname: visitor.usageLastname,
      });
      expect(dbVersion.request.units[0].workflow.steps[0].state).toHaveProperty('value', WORKFLOW_DECISION_ACCEPTED);
      expect(dbVersion).toHaveProperty('request._id', dummyRequest._id);
      expect(dbVersion.identityDocuments[0]).toHaveProperty('kind', ID_DOCUMENT_PASSPORT);
      expect(dbVersion.identityDocuments[0].file).toHaveProperty('_id');
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await Campus.findOneAndDelete({ _id: campus._id });
    await Visitor.findOneAndDelete({ email: visitor.email });
    await User.findOneAndDelete({ _id: owner._id });
  }
});

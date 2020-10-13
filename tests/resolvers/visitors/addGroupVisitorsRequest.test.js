import { nanoid } from 'nanoid';
import queryFactory, { gql } from '../../helpers/apollo-query';
import { generateDummyAdmin, generateDummyUser } from '../../models/user';
import Request, { createDummyRequest } from '../../models/request';
import { createDummyCampus } from '../../models/campus';
import Visitor from '../../models/visitor';
import { csvFileUpload } from '../../helpers/file-upload';

function mutatecreateGroupVisitorsRequest(campusId, requestId, file, user = null) {
  const { mutate } = queryFactory(user);
  return mutate({
    mutation: gql`
        mutation createGroupVisitorsRequestMutation($campusId: String!, $requestId: String!, $file: Upload!) {
            mutateCampus(id: $campusId) {
                mutateRequest(id: $requestId) {
                    createGroupVisitors(file: $file) {
                        visitor {
                            id
                        }
                        errors {
                            lineNumber
                            field
                            kind
                        }
                    }
                }
            }
        }
    `,
    variables: { campusId, requestId: requestId.toString ? requestId.toString() : requestId, file },
  });
}

it('Test to add a group of visitors to a request', async () => {
  const campus = await createDummyCampus();
  const owner = await generateDummyUser();
  const dummyRequest = await createDummyRequest({ campus, owner });
  const file = csvFileUpload;
  try {
    {
      const { errors } = await mutatecreateGroupVisitorsRequest(campus._id, dummyRequest._id, file);

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Not Authorised');
    }

    {
      const { errors } = await mutatecreateGroupVisitorsRequest(campus._id, nanoid(), file, generateDummyAdmin());

      // You're not authorized to create request while without rights
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Request not found');
    }

    {
      const {
        data:
        {
          mutateCampus:
          {
            mutateRequest: { createGroupVisitors },
          },
        },
      } = await mutatecreateGroupVisitorsRequest(
        campus._id,
        dummyRequest._id,
        file,
        generateDummyAdmin(),
      );
      expect(createGroupVisitors).toHaveLength(2);
      expect(createGroupVisitors[0].errors).toBe(null);
      expect(createGroupVisitors[1].errors).toHaveLength(1);
      const dbVersion = await Visitor.findById(createGroupVisitors[0].visitor.id);
      expect(dbVersion).toHaveProperty('request._id', dummyRequest._id);
      expect(dbVersion).toHaveProperty('__v', 0);
    }
  } finally {
    await Visitor.deleteMany();
    await Request.findOneAndDelete({ _id: dummyRequest._id });
    await campus.deleteOne();
  }
});
